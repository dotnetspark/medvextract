from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.models.database import async_session, Patient
from pydantic import BaseModel
from backend.utils.resiliency import resilient, sanitize_input, SafeLogger
from typing import Optional, List
from datetime import datetime

router = APIRouter()
logger = SafeLogger(__name__)


# --------------------------
# Schemas
# --------------------------
class PatientCreate(BaseModel):
    """Schema for creating/updating a Patient."""
    id: int
    name: str
    species: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
    owner_name: Optional[str] = None


class PatientOut(BaseModel):
    """Schema for returning Patient details."""
    id: int
    name: str
    species: Optional[str] = None
    breed: Optional[str] = None
    age: Optional[int] = None
    owner_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


async def get_db():
    async with async_session() as session:
        yield session


# --------------------------
# Create Patient
# --------------------------
@router.post("/", response_model=PatientOut, status_code=201, tags=["Patients"])
@resilient()
async def create_patient(patient: PatientCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new patient record.

    - **201**: Patient created successfully, returns created patient info.
    - **400**: Invalid request payload.
    - **500**: Internal server error.
    """
    try:
        db_patient = Patient(
            **{k: sanitize_input(v) if isinstance(v, str) else v for k, v in patient.dict().items()}
        )
        db.add(db_patient)
        await db.commit()
        await db.refresh(db_patient)
        logger.info(f"Patient created: {db_patient.id}")
        return db_patient
    except Exception as e:
        logger.error(f"Error creating patient: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create patient: {str(e)}")


# --------------------------
# Get Patient by ID
# --------------------------
@router.get("/{patient_id}", response_model=PatientOut, tags=["Patients"])
@resilient()
async def get_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    """
    Get a patient by ID.

    - **200**: Patient details.
    - **404**: Patient not found.
    """
    try:
        result = await db.execute(select(Patient).where(Patient.id == patient_id))
        db_patient = result.scalars().first()
        if not db_patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return db_patient
    except Exception as e:
        logger.error(f"Error retrieving patient: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve patient: {str(e)}")


# --------------------------
# List Patients
# --------------------------
@router.get("/", response_model=List[PatientOut], tags=["Patients"])
@resilient(fallback_value=[])
async def list_patients(db: AsyncSession = Depends(get_db)):
    """
    List all patients.

    - **200**: List of patients.
    """
    try:
        result = await db.execute(select(Patient))
        patients = result.scalars().all()
        logger.info(f"Patients listed: {len(patients)} found")
        return patients
    except Exception as e:
        logger.error(f"Error listing patients: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to list patients: {str(e)}")


# --------------------------
# Update Patient
# --------------------------
@router.put("/{patient_id}", response_model=PatientOut, tags=["Patients"])
@resilient()
async def update_patient(patient_id: int, patient: PatientCreate, db: AsyncSession = Depends(get_db)):
    """
    Update an existing patient record.

    - **200**: Patient updated successfully, returns updated patient info.
    - **404**: Patient not found.
    - **500**: Internal server error.
    """
    try:
        result = await db.execute(select(Patient).where(Patient.id == patient_id))
        db_patient = result.scalars().first()
        if not db_patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        for key, value in patient.dict(exclude={"id"}).items():
            setattr(db_patient, key, sanitize_input(value)
                    if isinstance(value, str) else value)
        await db.commit()
        await db.refresh(db_patient)
        return db_patient
    except Exception as e:
        logger.error(f"Error updating patient: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update patient: {str(e)}")


# --------------------------
# Delete Patient
# --------------------------
@router.delete("/{patient_id}", tags=["Patients"])
@resilient()
async def delete_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    """
    Delete a patient by ID.

    - **204**: Patient deleted successfully.
    - **404**: Patient not found.
    - **500**: Internal server error.
    """
    try:
        result = await db.execute(select(Patient).where(Patient.id == patient_id))
        db_patient = result.scalars().first()
        if not db_patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        await db.delete(db_patient)
        await db.commit()
        return {"detail": "Patient deleted"}
    except Exception as e:
        logger.error(f"Error deleting patient: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to delete patient: {str(e)}")
