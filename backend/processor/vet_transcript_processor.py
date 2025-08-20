"""
vet_transcript_processor.py

Async Celery task for veterinary consult transcript processing:

Workflow:
 - Validate incoming VetInput with Pydantic v2
 - Generate cache key and check Redis
 - If no cache hit: Insert PENDING TranscriptResult into Postgres
 - Call AI model (b.ExtractVetTasks) to get VetOutput
 - Sanitize output (remove Pydantic wrappers, enums to strings)
 - Update DB record to COMPLETED with raw & sanitized results
 - Store sanitized result in Redis (24h expiry)
 - If any error occurs: update DB to FAILED with error message, log traceback

Tech Stack:
 - Celery + Redis (broker, results backend, caching)
 - SQLAlchemy async ORM (PostgreSQL JSONB storage)
 - Pydantic v2 schemas
 - baml_client for AI model execution
"""


import os
import logging
import hashlib
import json
import redis
from enum import Enum
from celery import Celery
from backend.models.database import async_session, TranscriptResult
from sqlalchemy.future import select
from baml_client.async_client import b
from backend.models.schemas import TaskStatus, VetInput
from pydantic import BaseModel

# Redis URL
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Celery
app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    result_expires=3600
)

# Redis cache client
redis_client = redis.from_url(REDIS_URL)
logger = logging.getLogger(__name__)


def get_cache_key(vet_input: VetInput) -> str:
    """Generate MD5 cache key from VetInput."""
    input_str = json.dumps(vet_input.model_dump(mode="json"), sort_keys=True)
    return hashlib.md5(input_str.encode("utf-8")).hexdigest()


def sanitize_payload(obj):
    if isinstance(obj, dict):
        if "value" in obj and isinstance(obj["value"], (str, int, float)):
            return obj["value"]
        return {k: sanitize_payload(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_payload(i) for i in obj]
    elif isinstance(obj, Enum):
        return obj.value
    elif isinstance(obj, BaseModel):
        return sanitize_payload(obj.model_dump())
    return obj


async def _process_vet_transcript(task_id: str, input_data: dict) -> dict:
    vet_input = VetInput(**input_data)
    cache_key = get_cache_key(vet_input)

    # --- Check cache
    try:
        cached = redis_client.get(cache_key)
        if cached:
            logger.info(f"[{task_id}] Cache HIT {cache_key}")
            return json.loads(cached)
    except Exception as e:
        logger.warning(f"[{task_id}] Redis get failed: {e}")

    # --- Store initial DB entry
    async with async_session() as db:
        db_entry = TranscriptResult(
            task_id=task_id,
            transcript=vet_input.transcript,
            notes=vet_input.notes,
            status=TaskStatus.PENDING,
            patient_id=vet_input.patient_id,
            consult_date=vet_input.consult_date,
            veterinarian_id=vet_input.veterinarian_id,
            clinic_id=vet_input.clinic_id,
            template_id=vet_input.template_id,
            language=vet_input.language
        )
        db.add(db_entry)
        await db.commit()
        logger.info(f"[{task_id}] Stored initial PENDING transcript")

    # --- Run extraction task
    logger.info(f"[{task_id}] Calling ExtractVetTasks...")
    result = await b.ExtractVetTasks(vet_input)
    result_dict = result.model_dump()
    sanitized_result = sanitize_payload(result_dict)

    # --- Update DB with result
    async with async_session() as db:
        res = await db.execute(
            select(TranscriptResult).where(TranscriptResult.task_id == task_id)
        )
        db_entry = res.scalars().first()
        if db_entry:
            db_entry.raw_result = result_dict
            db_entry.result = sanitized_result
            db_entry.status = TaskStatus.COMPLETED
            await db.commit()
            logger.info(f"[{task_id}] Updated DB entry => COMPLETED")

    # --- Update cache
    try:
        redis_client.setex(cache_key, 86400, json.dumps(sanitized_result))
        logger.info(f"[{task_id}] Cached result in Redis")
    except Exception as e:
        logger.warning(f"[{task_id}] Redis setex failed: {e}")

    return sanitized_result


@app.task(bind=True)
def process_vet_transcript(self, input: dict):
    """Celery task: Process veterinary transcript asynchronously."""
    try:
        return asyncio.run(_process_vet_transcript(self.request.id, input))
    except Exception as e:
        logger.exception(
            f"[{self.request.id}] Failed to process transcript: {e}")
        # Update DB status to FAILED

        async def fail_entry():
            async with async_session() as db:
                res = await db.execute(
                    select(TranscriptResult).where(
                        TranscriptResult.task_id == self.request.id)
                )
                entry = res.scalars().first()
                if entry:
                    entry.status = TaskStatus.FAILED
                    entry.error_message = str(e)
                    await db.commit()
        asyncio.run(fail_entry())
        raise
