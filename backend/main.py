from fastapi import FastAPI, Request
import logging
import os

from backend.VetClient.baml_vet_client import baml_vet_client
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from backend.api.clinic import router as clinic_router
from backend.api.veterinarian import router as veterinarian_router
from backend.api.patient import router as patient_router
from backend.api.task import router as task_router
from backend.api.transcript import router as transcript_router
from backend.utils.resiliency import SafeLogger
from fastapi.responses import RedirectResponse

app = FastAPI(
    title="Medical Visit Action Extraction API",
    description="API for extracting veterinary SOAP notes, tasks, and reminders from consult transcripts, with PiMS integration and HIPAA compliance.",
    version="1.0.0",
    # openapi_tags can be defined here for global tags, or per router for local tags
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
logger = SafeLogger(__name__)
logger.handlers = [logging.StreamHandler()]
logger.setLevel(logging.INFO)

baml_client = baml_vet_client()


@app.get("/")
async def root():
    """
    API root endpoint. Returns welcome message.
    Returns:
        200: Welcome message.
    """
    return {"message": "Welcome to the Medical Visit Action Extraction API!"}


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    Returns:
        200: Healthy status.
    """
    return {"status": "healthy"}


# Enforce HTTPS redirect middleware
# Enforce HTTPS redirect middleware only in production
if os.getenv("ENV") == "production":
    @app.middleware("http")
    async def https_redirect(request: Request, call_next):
        if request.url.scheme != "https":
            url = request.url.replace(scheme="https")
            return RedirectResponse(url=str(url))
        return await call_next(request)


# Routers (all endpoints now modular)
app.include_router(clinic_router, prefix="/clinics", tags=["Clinics"])
app.include_router(veterinarian_router,
                   prefix="/veterinarians", tags=["Veterinarians"])
app.include_router(patient_router, prefix="/patients", tags=["Patients"])
app.include_router(transcript_router, prefix="/transcripts",
                   tags=["Transcripts"])
app.include_router(task_router, prefix="/tasks", tags=["Tasks"])

# Resiliency & Security Best Practices:
# - Use tenacity for retry/exponential backoff on external calls (see routers)
# - Use pybreaker for circuit breaker on unreliable services
# - Always validate and sanitize input
# - Log only non-PHI/PII data
# - Use HTTPS in production

# Example usage for routers:
# @retryable() @circuit_breaker() async def call_external(...): ...
# value = sanitize_input(user_input)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
