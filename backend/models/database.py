# backend/models/database.py
import os
import enum
from datetime import datetime
from dotenv import load_dotenv

from sqlalchemy import (
    Column, String, Integer, DateTime, ForeignKey,
    Enum, Index, func
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# ---------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------
load_dotenv()

user = os.getenv("POSTGRES_USER")
password = os.getenv("POSTGRES_PASSWORD")
host = os.getenv("POSTGRES_HOST")
port = os.getenv("POSTGRES_PORT")
target_db = os.getenv("POSTGRES_DB")

if not all([user, password, host, port, target_db]):
    raise RuntimeError("Database environment variables are not fully set.")

# ---------------------------------------------------------
# Database Configuration (Async Engine & Session)
# ---------------------------------------------------------
ASYNC_DATABASE_URL = f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{target_db}"
async_engine = create_async_engine(ASYNC_DATABASE_URL, future=True, echo=False)
async_session = sessionmaker(
    async_engine, expire_on_commit=False, class_=AsyncSession
)

Base = declarative_base()

# ---------------------------------------------------------
# Enums
# ---------------------------------------------------------


class TaskStatus(enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

# ---------------------------------------------------------
# Mixins for common columns
# ---------------------------------------------------------


class TimestampMixin:
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True),
                        onupdate=func.now(), nullable=True)

# ---------------------------------------------------------
# Models
# ---------------------------------------------------------


class Patient(Base, TimestampMixin):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    species = Column(String)
    breed = Column(String)
    age = Column(Integer)
    owner_name = Column(String)

    transcripts = relationship("TranscriptResult", back_populates="patient")


class Clinic(Base, TimestampMixin):
    __tablename__ = "clinics"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    country = Column(String)
    phone = Column(String)
    email = Column(String)
    latitude = Column(String)
    longitude = Column(String)

    veterinarians = relationship("Veterinarian", back_populates="clinic")


class Veterinarian(Base, TimestampMixin):
    __tablename__ = "veterinarians"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    license_number = Column(String)
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=False)

    clinic = relationship("Clinic", back_populates="veterinarians")
    transcripts = relationship(
        "TranscriptResult", back_populates="veterinarian")


class TranscriptResult(Base, TimestampMixin):
    __tablename__ = "transcript_results"

    id = Column(Integer, primary_key=True, index=True)
    # UUID type if you want DB-native UUID generation
    task_id = Column(String, unique=True, index=True, nullable=False)

    transcript = Column(String, nullable=False)
    notes = Column(String)

    # AI output
    result = Column(JSONB)         # structured VetOutput
    raw_result = Column(JSONB)     # raw AI provider output

    # Flexible extra data (if any)
    meta_extra = Column(JSONB, nullable=True)

    status = Column(Enum(TaskStatus),
                    default=TaskStatus.PENDING, nullable=False)
    error_message = Column(String)

    # Core metadata from VetInput - stored in typed columns
    consult_date = Column(DateTime(timezone=True), nullable=False)
    language = Column(String, nullable=True)
    template_id = Column(String, nullable=False)

    # FK references
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    veterinarian_id = Column(String, ForeignKey(
        "veterinarians.id"), nullable=False)
    clinic_id = Column(String, ForeignKey("clinics.id"), nullable=False)

    # ORM relationships
    patient = relationship("Patient", back_populates="transcripts")
    veterinarian = relationship("Veterinarian", back_populates="transcripts")
    clinic = relationship("Clinic")

    __table_args__ = (
        Index("idx_transcripts_consult_date", "consult_date"),
        Index("idx_transcripts_patient_id", "patient_id"),
        Index("idx_transcripts_vet_id", "veterinarian_id"),
        Index("idx_transcripts_clinic_id", "clinic_id"),
        Index("idx_transcripts_status", "status"),
    )

# ---------------------------------------------------------
# DB Init
# ---------------------------------------------------------


async def init_db():
    """Initialize database tables asynchronously."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
