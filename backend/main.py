from celery.result import AsyncResult
from fastapi import FastAPI, HTTPException
import logging

from pydantic import BaseModel
from backend.models.schemas import VetInput, VetOutput
from backend.VetClient.baml_vet_client import baml_vet_client
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.task import process_vet_transcript

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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Logging (HIPAA-compliant: no PHI in logs)
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

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
    """Check the status of a Celery task."""
    try:
        task = AsyncResult(task_id)
        if task.state == "PENDING":
            logger.info(f"Task {task_id} is still processing")
            return {"status": "processing"}
        elif task.state == "SUCCESS":
            result = task.result
            logger.info(f"Task {task_id} completed successfully")
            return {"status": "completed", "result": result}
        elif task.state == "FAILURE":
            logger.error(f"Task {task_id} failed: {str(task.result)}")
            return {"status": "failed", "error": str(task.result)}
        else:
            logger.warning(f"Task {task_id} in unexpected state: {task.state}")
            return {"status": task.state}
    except Exception as e:
        logger.error(f"Error checking task status {task_id}: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to check task status: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
