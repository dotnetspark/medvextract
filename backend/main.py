from backend.models.database import SessionLocal, TranscriptResult, TaskStatus
from celery.result import AsyncResult
from fastapi import FastAPI, HTTPException
import logging

from pydantic import BaseModel
from backend.models.schemas import VetInput, VetOutput
from backend.VetClient.baml_vet_client import baml_vet_client
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.task import process_vet_transcript
from sqlalchemy import select

app = FastAPI(
    title="Medical Visit Action Extraction API",
    description="API for extracting veterinary SOAP notes, tasks, and reminders from consult transcripts, with PiMS integration and HIPAA compliance.",
    version="1.0.0",
    openapi_tags=[
        {"name": "Tasks", "description": "Extract veterinary tasks and SOAP notes."},
        {"name": "Health", "description": "API health check."},
        {"name": "Task Status",
            "description": "Check the status of a background extraction task by task_id."}
    ],
    docs_url="/docs",
    swagger_favicon_url="/static/favicon.ico"
)

app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Allow CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Logging (HIPAA-compliant: no PHI in logs)
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)
logger.handlers = [logging.StreamHandler()] 
logger.setLevel(logging.INFO)

baml_client = baml_vet_client()


@app.get("/")
async def root():
    return {"message": "Welcome to the Medical Visit Action Extraction API!"}


class TaskIdResponse(BaseModel):
    task_id: str


@app.post("/extract-tasks", response_model=TaskIdResponse)
async def extract_tasks(input: VetInput):
    """Submit a veterinary transcript for task extraction."""
    try:
        logger.info(f"Received transcript: {input.transcript[:50]}...")
        task = process_vet_transcript.delay(input.model_dump())
        logger.info(f"Started task: {task.id}")
        return TaskIdResponse(task_id=task.id)
    except Exception as e:
        logger.error(f"Error starting task: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to start task: {str(e)}")


@app.get("/task/{task_id}")
async def get_task_status(task_id: str):
    """Check the status of a task: DB first, then Celery if not found."""
    try:
        db = SessionLocal()
        try:
            db_entry = db.query(TranscriptResult).filter_by(task_id=task_id).first()
            if db_entry:
                # Normalize status and use TaskStatus enum for comparison
                status_enum = db_entry.status if isinstance(db_entry.status, TaskStatus) else TaskStatus(db_entry.status)
                response = {"status": status_enum.value.lower()}
                if status_enum == TaskStatus.COMPLETED:
                    response["result"] = db_entry.result
                elif status_enum == TaskStatus.FAILED:
                    response["error"] = db_entry.error_message
                return response
        finally:
            db.close()

        # If not in DB, check Celery
        task = AsyncResult(task_id)
        if task.state == "PENDING":
            logger.info(f"Task {task_id} is still processing (not in DB)")
            return {"status": "processing"}
        elif task.state == "SUCCESS":
            result = task.result
            logger.info(f"Task {task_id} completed successfully (not in DB)")
            return {"status": "completed", "result": result}
        elif task.state == "FAILURE":
            logger.error(f"Task {task_id} failed: {str(task.result)} (not in DB)")
            return {"status": "failed", "error": str(task.result)}
        else:
            logger.warning(f"Task {task_id} in unexpected state: {task.state} (not in DB)")
            return {"status": task.state}
    except Exception as e:
        logger.error(f"Error checking task status {task_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to check task status: {str(e)}")

@app.get("/transcripts")
async def get_transcripts():
    """Retrieve all transcripts from the database."""
    try:
        db = SessionLocal()
        try:
            query = select(TranscriptResult)
            transcripts = db.execute(query).scalars().all()
            logger.info(f"Retrieved {len(transcripts)} transcripts from database.")
            return [{
                "id": transcript.id,
                "task_id": transcript.task_id,
                "transcript": transcript.transcript,
                "notes": transcript.notes,
                "meta_data": transcript.meta_data,
                "result": transcript.result,
                "raw_result": transcript.raw_result,
                "status": transcript.status.value,
                "error_message": transcript.error_message,
                "created_at": transcript.created_at.isoformat() if transcript.created_at else None,
                "updated_at": transcript.updated_at.isoformat() if transcript.updated_at else None
            } for transcript in transcripts]
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error retrieving transcripts: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve transcripts: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
