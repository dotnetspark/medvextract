# backend/models/database.py
from sqlalchemy import create_engine, Column, String, Integer, JSON, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import enum

# Load environment variables from .env file
load_dotenv()

# Database configuration
DATABASE_URL = f"postgresql://postgres:{os.getenv('POSTGRES_PASSWORD')}@localhost:5432/medvextract"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class TaskStatus(enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class TranscriptResult(Base):
    __tablename__ = "transcript_results"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True, index=True)
    transcript = Column(String, nullable=False)
    notes = Column(String, nullable=True)
    meta_data = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
    raw_result = Column(JSON, nullable=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    error_message = Column(String, nullable=True)

def init_db():
    """Initialize the database and create tables."""
    Base.metadata.create_all(bind=engine)