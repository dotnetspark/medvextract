from fastapi import APIRouter, HTTPException
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from backend.models.database import async_session, TranscriptResult, TaskStatus
from backend.utils.resiliency import resilient, SafeLogger
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime
import enum

logger = SafeLogger(__name__)
router = APIRouter()


# --------------------------
# Schemas
# --------------------------
class TranscriptOut(BaseModel):
    """Response model for transcript output."""
    id: int
    task_id: str
    transcript: str
    notes: Optional[str] = None

    # AI output fields
    result: Optional[Dict[str, Any]] = None      # structured VetOutput
    raw_result: Optional[Dict[str, Any]] = None  # raw AI provider result
    meta_extra: Optional[Dict[str, Any]] = None  # flexible extra data

    status: str
    error_message: Optional[str] = None

    # Core metadata fields from VetInput
    consult_date: datetime
    language: Optional[str] = None
    template_id: str

    # Foreign keys (optional to expose)
    patient_id: Optional[int] = None
    veterinarian_id: Optional[str] = None
    clinic_id: Optional[str] = None

    # Denormalized names for UI display (from joins)
    patient_name: Optional[str] = None
    veterinarian_name: Optional[str] = None
    clinic_name: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Allows ORM conversion


# --------------------------
# Get All Transcripts
# --------------------------
@router.get("/", response_model=List[TranscriptOut], tags=["Transcripts"])
@resilient(fallback_value=[])
async def get_transcripts():
    """
    Retrieve all transcripts with related patient, veterinarian, and clinic in one query.
    - **200**: Transcripts retrieved successfully.
    - **500**: Internal server error.
    """
    try:
        async with async_session() as session:
            stmt = (
                select(TranscriptResult)
                .options(
                    selectinload(TranscriptResult.patient),
                    selectinload(TranscriptResult.veterinarian),
                    selectinload(TranscriptResult.clinic)
                )
            )
            result = await session.execute(stmt)
            transcripts = result.scalars().all()
            results = []
            for tr in transcripts:
                results.append({
                    "id": tr.id,
                    "task_id": tr.task_id,
                    "transcript": tr.transcript,
                    "notes": tr.notes,
                    "result": tr.result,
                    "raw_result": tr.raw_result,
                    "meta_extra": tr.meta_extra,
                    "status": tr.status.value if isinstance(tr.status, enum.Enum) else tr.status,
                    "error_message": tr.error_message,
                    "consult_date": tr.consult_date.isoformat() if tr.consult_date else None,
                    "language": tr.language,
                    "template_id": tr.template_id,
                    "patient_id": tr.patient_id,
                    "veterinarian_id": tr.veterinarian_id,
                    "clinic_id": tr.clinic_id,
                    "patient_name": tr.patient.name if tr.patient else None,
                    "veterinarian_name": tr.veterinarian.name if tr.veterinarian else None,
                    "clinic_name": tr.clinic.name if hasattr(tr, "clinic") and tr.clinic else None,
                    "created_at": tr.created_at.isoformat() if tr.created_at else None,
                    "updated_at": tr.updated_at.isoformat() if tr.updated_at else None,
                })
            return results
    except Exception as e:
        logger.error(f"Error retrieving transcripts: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve transcripts: {str(e)}")
