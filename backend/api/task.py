from fastapi import APIRouter, HTTPException
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from backend.models.database import (
    async_session,
    TranscriptResult,
    TaskStatus
)
from backend.models.schemas import VetInput
from backend.processor.vet_transcript_processor import process_vet_transcript
from celery.result import AsyncResult
from pydantic import BaseModel
from backend.utils.resiliency import resilient, sanitize_input, SafeLogger
from typing import Optional, Dict, Any, List
from datetime import datetime
import enum

logger = SafeLogger(__name__)
router = APIRouter()


# --------------------------
# Schemas
# --------------------------
class TaskIdResponse(BaseModel):
    """Response model for task ID."""
    task_id: str


class TaskStatusResponse(BaseModel):
    """Response model for task status."""
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# --------------------------
# Extract Tasks
# --------------------------
@router.post("/extract-tasks", response_model=TaskIdResponse, status_code=202, tags=["Tasks"])
@resilient(fallback_value={"task_id": None})
async def extract_tasks(input: VetInput):
    """
    Submit a veterinary transcript for task extraction.

    - **202**: Task accepted for processing.
    - **400**: Invalid request payload.
    - **500**: Internal server error.
    """
    try:
        safe_transcript = sanitize_input(input.transcript)
        logger.info(f"Received transcript: {safe_transcript[:50]}...")
        task = process_vet_transcript.delay(input.model_dump())
        logger.info(f"Started task: {task.id}")
        return TaskIdResponse(task_id=task.id)
    except Exception as e:
        logger.error(f"Error starting task: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to start task: {str(e)}")


# --------------------------
# Get Task Status
# --------------------------
@router.get("/task/{task_id}", response_model=TaskStatusResponse, tags=["Tasks"])
@resilient()
async def get_task_status(task_id: str):
    """
    Check the status of a task: first check DB, then Celery if not in DB.

    - **200**: Task found and status returned.
    - **404**: Task not found.
    - **500**: Internal server error.
    """
    try:
        async with async_session() as session:
            stmt = select(TranscriptResult).where(
                TranscriptResult.task_id == task_id)
            result = await session.execute(stmt)
            transcript = result.scalars().first()

            if transcript:
                status_enum = transcript.status if isinstance(
                    transcript.status, TaskStatus) else TaskStatus(transcript.status)
                response = {"status": status_enum.value.lower()}

                if status_enum == TaskStatus.COMPLETED:
                    response["result"] = transcript.result
                elif status_enum == TaskStatus.FAILED:
                    response["error"] = transcript.error_message

                return response

        # Fall back to Celery if task not found in DB
        task = AsyncResult(task_id)
        if task.state == "PENDING":
            return {"status": "processing"}
        elif task.state == "SUCCESS":
            return {"status": "completed", "result": task.result}
        elif task.state == "FAILURE":
            return {"status": "failed", "error": str(task.result)}
        else:
            return {"status": task.state}

    except Exception as e:
        logger.error(f"Error checking task status: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to check task status: {str(e)}")
