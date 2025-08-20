from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.models.database import async_session, Clinic
from pydantic import BaseModel
from backend.utils.resiliency import resilient, sanitize_input, SafeLogger
from typing import Optional, List
from datetime import datetime

router = APIRouter()
logger = SafeLogger(__name__)


# --------------------------
# Schemas
# --------------------------
class ClinicCreate(BaseModel):
    """Schema for creating/updating a Clinic."""
    id: str
    name: str
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None


class ClinicOut(BaseModel):
    """Schema for returning Clinic details."""
    id: str
    name: str
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


async def get_db():
    async with async_session() as session:
        yield session


# --------------------------
# Create Clinic
# --------------------------
@router.post("/", response_model=ClinicOut, status_code=201, tags=["Clinics"])
@resilient()
async def create_clinic(clinic: ClinicCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new clinic record.

    - **201**: Clinic created successfully, returns created clinic info.
    - **400**: Invalid request payload.
    - **500**: Internal server error.
    """
    try:
        db_clinic = Clinic(
            **{k: sanitize_input(v) if isinstance(v, str) else v for k, v in clinic.dict().items()}
        )
        db.add(db_clinic)
        await db.commit()
        await db.refresh(db_clinic)
        logger.info(f"Clinic created: {db_clinic.id}")
        return db_clinic
    except Exception as e:
        logger.error(f"Error creating clinic: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create clinic: {str(e)}")


# --------------------------
# Get Clinic by ID
# --------------------------
@router.get("/{clinic_id}", response_model=ClinicOut, tags=["Clinics"])
@resilient()
async def get_clinic(clinic_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve a clinic by ID.

    - **200**: Clinic details.
    - **404**: Clinic not found.
    """
    try:
        clinic_id = sanitize_input(clinic_id)
        result = await db.execute(select(Clinic).where(Clinic.id == clinic_id))
        clinic = result.scalars().first()
        if not clinic:
            logger.warning(f"Clinic not found: {clinic_id}")
            raise HTTPException(status_code=404, detail="Clinic not found")
        logger.info(f"Clinic retrieved: {clinic_id}")
        return clinic
    except Exception as e:
        logger.error(f"Error retrieving clinic: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve clinic: {str(e)}")


# --------------------------
# List Clinics
# --------------------------
@router.get("/", response_model=List[ClinicOut], tags=["Clinics"])
@resilient(fallback_value=[])
async def list_clinics(db: AsyncSession = Depends(get_db)):
    """
    Retrieve a list of all clinics.

    - **200**: List of clinic records.
    """
    try:
        result = await db.execute(select(Clinic))
        clinics = result.scalars().all()
        logger.info(f"Clinics listed: {len(clinics)} found")
        return clinics
    except Exception as e:
        logger.error(f"Error listing clinics: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to list clinics: {str(e)}")


# --------------------------
# Update Clinic
# --------------------------
@router.put("/{clinic_id}", response_model=ClinicOut, tags=["Clinics"])
@resilient()
async def update_clinic(clinic_id: str, clinic: ClinicCreate, db: AsyncSession = Depends(get_db)):
    """
    Update an existing clinic by ID.

    - **200**: Updated clinic info.
    - **404**: Clinic not found.
    - **400**: Invalid request payload.
    """
    try:
        clinic_id = sanitize_input(clinic_id)
        result = await db.execute(select(Clinic).where(Clinic.id == clinic_id))
        db_clinic = result.scalars().first()
        if not db_clinic:
            logger.warning(f"Clinic not found: {clinic_id}")
            raise HTTPException(status_code=404, detail="Clinic not found")

        for key, value in clinic.dict(exclude={"id"}).items():
            setattr(db_clinic, key, sanitize_input(value)
                    if isinstance(value, str) else value)

        await db.commit()
        await db.refresh(db_clinic)
        logger.info(f"Clinic updated: {clinic_id}")
        return db_clinic
    except Exception as e:
        logger.error(f"Error updating clinic: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update clinic: {str(e)}")


# --------------------------
# Delete Clinic
# --------------------------
@router.delete("/{clinic_id}", tags=["Clinics"])
@resilient()
async def delete_clinic(clinic_id: str, db: AsyncSession = Depends(get_db)):
    """
    Delete a clinic by ID.

    - **200**: Confirmation message if deleted.
    - **404**: Clinic not found.
    """
    try:
        clinic_id = sanitize_input(clinic_id)
        result = await db.execute(select(Clinic).where(Clinic.id == clinic_id))
        db_clinic = result.scalars().first()
        if not db_clinic:
            logger.warning(f"Clinic not found: {clinic_id}")
            raise HTTPException(status_code=404, detail="Clinic not found")

        await db.delete(db_clinic)
        await db.commit()
        logger.info(f"Clinic deleted: {clinic_id}")
        return {"detail": "Clinic deleted"}
    except Exception as e:
        logger.error(f"Error deleting clinic: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to delete clinic: {str(e)}")
