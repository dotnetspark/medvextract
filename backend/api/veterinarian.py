from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from backend.models.database import async_session, Veterinarian
from pydantic import BaseModel
from backend.utils.resiliency import resilient, sanitize_input, SafeLogger
from typing import Optional, Dict, Any, List
from datetime import datetime

router = APIRouter()
logger = SafeLogger(__name__)

# --------------------------
# Schemas
# --------------------------


class VeterinarianCreate(BaseModel):
    """Schema for creating/updating a Veterinarian."""
    id: str
    name: str
    license_number: Optional[str] = None
    clinic_id: Optional[str] = None


class VeterinarianOut(BaseModel):
    """Schema for returning Veterinarian details."""
    id: str
    name: str
    license_number: Optional[str] = None
    clinic_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


async def get_db():
    async with async_session() as session:
        yield session

# --------------------------
# Create Veterinarian
# --------------------------


@router.post("/", response_model=VeterinarianOut, status_code=201, tags=["Veterinarians"])
@resilient()
async def create_veterinarian(vet: VeterinarianCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new veterinarian record.

    - **Returns** `201`: Newly created veterinarian info.
    - **Raises** `400`: Bad request if input is invalid.
    - **Raises** `500`: Internal server error on failure.
    """
    try:
        db_vet = Veterinarian(
            **{k: sanitize_input(v) if isinstance(v, str) else v for k, v in vet.dict().items()}
        )
        db.add(db_vet)
        await db.commit()
        await db.refresh(db_vet)
        logger.info(f"Veterinarian created: {db_vet.id}")
        return db_vet
    except Exception as e:
        logger.error(f"Error creating veterinarian: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to create veterinarian: {str(e)}")


# --------------------------
# Get Veterinarian by ID
# --------------------------
@router.get("/{vet_id}", response_model=VeterinarianOut, tags=["Veterinarians"])
@resilient()
async def get_veterinarian(vet_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve a veterinarian by ID.

    - **Returns** `200`: Veterinarian details.
    - **Raises** `404`: If veterinarian not found.
    """
    try:
        vet_id = sanitize_input(vet_id)
        result = await db.execute(select(Veterinarian).where(Veterinarian.id == vet_id))
        vet = result.scalars().first()
        if not vet:
            logger.warning(f"Veterinarian not found: {vet_id}")
            raise HTTPException(
                status_code=404, detail="Veterinarian not found")
        logger.info(f"Veterinarian retrieved: {vet_id}")
        return vet
    except Exception as e:
        logger.error(f"Error retrieving veterinarian: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve veterinarian: {str(e)}")


# --------------------------
# List Veterinarians
# --------------------------
@router.get("/", response_model=List[VeterinarianOut], tags=["Veterinarians"])
@resilient(fallback_value=[])
async def list_veterinarians(db: AsyncSession = Depends(get_db)):
    """
    Retrieve a list of all veterinarians.

    - **Returns** `200`: List of veterinarian records.
    """
    try:
        result = await db.execute(select(Veterinarian))
        vets = result.scalars().all()
        logger.info(f"Veterinarians listed: {len(vets)} found")
        return vets
    except Exception as e:
        logger.error(f"Error listing veterinarians: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to list veterinarians: {str(e)}")


# --------------------------
# Update Veterinarian
# --------------------------
@router.put("/{vet_id}", response_model=VeterinarianOut, tags=["Veterinarians"])
@resilient()
async def update_veterinarian(vet_id: str, vet: VeterinarianCreate, db: AsyncSession = Depends(get_db)):
    """
    Update an existing veterinarian by ID.

    - **Returns** `200`: Updated veterinarian info.
    - **Raises** `404`: If veterinarian not found.
    - **Raises** `400`: If input is invalid.
    """
    try:
        vet_id = sanitize_input(vet_id)
        result = await db.execute(select(Veterinarian).where(Veterinarian.id == vet_id))
        db_vet = result.scalars().first()
        if not db_vet:
            logger.warning(f"Veterinarian not found: {vet_id}")
            raise HTTPException(
                status_code=404, detail="Veterinarian not found")

        for key, value in vet.dict(exclude={"id"}).items():
            setattr(db_vet, key, sanitize_input(value)
                    if isinstance(value, str) else value)

        await db.commit()
        await db.refresh(db_vet)
        logger.info(f"Veterinarian updated: {vet_id}")
        return db_vet
    except Exception as e:
        logger.error(f"Error updating veterinarian: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to update veterinarian: {str(e)}")


# --------------------------
# Delete Veterinarian
# --------------------------
@router.delete("/{vet_id}", tags=["Veterinarians"])
@resilient()
async def delete_veterinarian(vet_id: str, db: AsyncSession = Depends(get_db)):
    """
    Delete a veterinarian by ID.

    - **Returns** `200`: Confirmation message if deleted.
    - **Raises** `404`: If veterinarian not found.
    """
    try:
        vet_id = sanitize_input(vet_id)
        result = await db.execute(select(Veterinarian).where(Veterinarian.id == vet_id))
        db_vet = result.scalars().first()
        if not db_vet:
            logger.warning(f"Veterinarian not found: {vet_id}")
            raise HTTPException(
                status_code=404, detail="Veterinarian not found")

        await db.delete(db_vet)
        await db.commit()
        logger.info(f"Veterinarian deleted: {vet_id}")
        return {"detail": "Veterinarian deleted"}
    except Exception as e:
        logger.error(f"Error deleting veterinarian: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to delete veterinarian: {str(e)}")
