from fastapi import FastAPI, HTTPException
import logging

from pydantic import BaseModel
from backend.models.schemas import VetInput, VetOutput
from backend.VetClient.baml_vet_client import baml_vet_client
from backend.VetClient.payload_sanitizer import sanitize_payload
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
baml_client = baml_vet_client()


app = FastAPI(
    title="Medical Visit Action Extraction API",
    description="API for extracting veterinary SOAP notes, tasks, and reminders from consult transcripts, with PiMS integration and HIPAA compliance.",
    version="1.0.0",
    openapi_tags=[
        {"name": "Tasks", "description": "Extract veterinary tasks and SOAP notes."},
        {"name": "PiMS", "description": "Export notes to Practice Management Systems."},
        {"name": "Health", "description": "API health check."}
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


@app.post("/extract-tasks", response_model=VetOutput)
async def extract_tasks(input: VetInput):
    try:
        logger.info("Processing transcript: %s", input.transcript[:50])
        result = await baml_client.extract_vet_tasks(input)

        result_dict = result.model_dump()

        sanitized_result = sanitize_payload(result_dict)

        return sanitized_result
    except Exception as e:
        logger.error("Error processing transcript: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
