from enum import Enum
import os
import logging
import hashlib
import redis
import json
from celery import Celery
from baml_client.async_client import b
from backend.models.schemas import VetInput
import asyncio


# Use environment variable for Redis URL if available
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
app = Celery('tasks', broker=REDIS_URL, backend=REDIS_URL)
app.conf.task_serializer = 'json'
app.conf.accept_content = ['json']
app.conf.result_serializer = 'json'
app.conf.result_expires = 3600  # Results expire after 1 hour

# Initialize Redis client for caching
redis_client = redis.from_url(REDIS_URL)
logger = logging.getLogger(__name__)


def get_cache_key(input: VetInput) -> str:
    """Generate a cache key based on transcript and metadata."""
    input_str = json.dumps(input.model_dump(), sort_keys=True)
    return hashlib.md5(input_str.encode('utf-8')).hexdigest()


@app.task
def process_vet_transcript(input: dict) -> dict:
    """Process a veterinary transcript asynchronously."""
    try:
        vet_input = VetInput(**input)
        cache_key = get_cache_key(vet_input)

        # Check Redis cache with error handling
        try:
            cached_result = redis_client.get(cache_key)
            logger.info(f"Cache result for key {cache_key}: {cached_result}")
        except Exception as redis_err:
            logger.warning(
                f"Redis unavailable (get) for key {cache_key}: {redis_err}")
            cached_result = None

        if cached_result:
            logger.info(
                f"Cache hit for key: {cache_key} transcript: {vet_input.transcript[:50]}...")
            return json.loads(cached_result)

        # Process transcript if not cached
        logger.info(
            f"Cache miss for key: {cache_key}. Processing transcript: {vet_input.transcript[:50]}...")

        result = asyncio.run(b.ExtractVetTasks(vet_input))
        result_dict = result.model_dump()
        sanitized_result = sanitize_payload(result_dict)
        logger.info(f"Sanitized result: {json.dumps(sanitized_result)}")

        # Cache result in Redis (expire after 24 hours)
        try:
            redis_client.setex(cache_key, 86400, json.dumps(sanitized_result))
            logger.info(f"Cached result for key: {cache_key}")
        except Exception as redis_err:
            logger.warning(
                f"Redis unavailable (setex) for key {cache_key}: {redis_err}")

        return sanitized_result
    except Exception as e:
        logger.error(f"Task failed: {str(e)}")
        raise


def sanitize_payload(obj):
    if isinstance(obj, dict):
        # Check if it's a Checked-style object with 'value' and 'checks'
        if 'value' in obj and isinstance(obj['value'], (str, int, float)):
            return obj['value']
        # Recursively sanitize dict
        return {k: sanitize_payload(v) for k, v in obj.items()}

    elif isinstance(obj, list):
        # Sanitize each item in list
        return [sanitize_payload(item) for item in obj]

    elif isinstance(obj, Enum):
        return obj.value.upper()

    elif hasattr(obj, 'model_dump'):
        # If it's a Pydantic model, dump it to dict then sanitize
        return sanitize_payload(obj.model_dump())

    # Primitive types are returned as-is
    return obj
