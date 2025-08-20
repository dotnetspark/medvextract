# API Layer Documentation

## Overview
This folder contains modular FastAPI routers for the veterinary extraction backend. Each resource (task, clinic, veterinarian, patient) is implemented in a separate file, following robust, secure, and maintainable patterns. The design is language-agnostic and can be adapted to any modern web framework.

## Intent
- **Modularization:** Each resource (task, clinic, veterinarian, patient) has its own router file for maintainability and scalability.
- **Resiliency:** All endpoints use retry and circuit breaker patterns to handle transient failures and improve reliability.
- **Security:** Input sanitization and HIPAA-compliant logging are enforced for all endpoints.
- **Documentation:** Every endpoint is documented for OpenAPI/Swagger, with explicit status codes and response models.

## File Structure
- `task.py`: Endpoints for task management.
- `clinic.py`: Endpoints for clinic management.
- `veterinarian.py`: Endpoints for veterinarian management.
- `patient.py`: Endpoints for patient management.
- `transcript.py`: Endpoints for transcripts management.

## Endpoint Patterns
All endpoints follow this pattern:
1. **Decorators:**
  - `@resilient()`: Unified decorator that applies both retry and circuit breaker patterns, with optional fallback values for robust error handling. All endpoints use this decorator.
2. **Input Sanitization:**
  - All string inputs are sanitized using `sanitize_input()` before use.
3. **Logging:**
  - All actions and errors are logged using `SafeLogger`, which redacts sensitive information and is HIPAA-compliant.
4. **Swagger Documentation:**
  - Each endpoint has a docstring describing its purpose, parameters, responses, and status codes.
5. **Status Codes:**
  - Explicit status codes for success (200, 201), not found (404), bad request (400), and internal error (500).
6. **Response Models:**
  - All Pydantic models use `Optional`, `Dict`, and `Any` for flexible, explicit typing. Models include `meta_data`, `error_message`, `created_at`, and `updated_at` fields where appropriate.
7. **List Endpoints:**
  - Use `@resilient(fallback_value=[])` for robust fallback.

## Example Endpoint (Python/FastAPI)
```python
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from backend.utils.resiliency import resilient, sanitize_input, SafeLogger

router = APIRouter()
logger = SafeLogger(__name__)

class ResourceCreate(BaseModel):
  id: str
  name: str
  description: Optional[str] = None

class ResourceOut(BaseModel):
  id: str
  name: str
  description: Optional[str] = None
  meta_data: Optional[Dict[str, Any]] = None
  error_message: Optional[str] = None
  created_at: Optional[str] = None
  updated_at: Optional[str] = None
  class Config:
    from_attributes = True

async def get_db():
  async with async_session() as session:
    yield session

@router.post("/", response_model=ResourceOut, status_code=201)
@resilient()
async def create_resource(resource: ResourceCreate, db: AsyncSession = Depends(get_db)):
  """
  Create a new resource.
  Returns:
    201: Resource created successfully.
    400: Bad request if input is invalid.
  """
  try:
    db_resource = Resource(**{k: sanitize_input(v) if isinstance(v, str) else v for k, v in resource.dict().items()})
    db.add(db_resource)
    await db.commit()
    await db.refresh(db_resource)
    logger.info(f"Resource created: {db_resource.id}")
    return db_resource
  except Exception as e:
    logger.error(f"Error creating resource: {e}")
    raise HTTPException(status_code=500, detail=f"Failed to create resource: {str(e)}")
```

## Adapting to Other Languages/Frameworks
- **Decorators/Annotations:** Use equivalent mechanisms (e.g., middleware, interceptors, attributes).
- **Resiliency:** Implement a unified resiliency decorator or middleware that combines retry and circuit breaker logic, with optional fallback values (e.g., Polly for .NET, resilience4j for Java, built-in features for Node.js).
- **Input Sanitization:** Use language-specific sanitization utilities.
- **Logging:** Ensure logs redact sensitive data and comply with privacy regulations.
- **Documentation:** Use OpenAPI/Swagger or equivalent for endpoint documentation.

## Instructions for LLMs
- Implement each resource as a modular router/controller/service.
- Apply the unified `@resilient` decorator and security patterns to every endpoint.
- Document endpoints with explicit status codes and response models.
- Ensure input sanitization and safe logging.
- Structure code for maintainability and scalability.

## References
- See `../utils/README.md` for details on resiliency and security utilities.
- See `../models/database.py` for ORM models.
- See `main.py` for router inclusion and application setup.


---
**Latest API Patterns (2025):**
- All endpoints use the `@resilient` decorator for unified retry/circuit breaker/fallback logic.
- All Pydantic models use `Optional`, `Dict`, and `Any` for flexible, explicit typing.
- Error handling is consistent: all exceptions are logged and return HTTP 500 with details.
- Logging is performed with `SafeLogger` for HIPAA-compliance and redaction.
- Input sanitization is enforced for all string fields.
- Response models include `meta_data`, `error_message`, `created_at`, and `updated_at` fields where appropriate.
- List endpoints use `@resilient(fallback_value=[])` for robust fallback.

This README is designed for LLM ingestion. Follow the patterns and instructions to reproduce the API layer in any language or framework.
