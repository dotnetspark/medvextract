# Models Folder Documentation

## Overview
This folder contains the ORM models and Pydantic schemas for the veterinary extraction backend. It defines the structure of the database tables and the data validation/serialization logic for API requests and responses.

## Files

### database.py
- **Purpose:** Defines the SQLAlchemy ORM models and async session setup for the application.
- **Key Features:**
  - Uses SQLAlchemy's async ORM (`AsyncSession`, `async_engine`).
  - Models include `Clinic`, `Veterinarian`, `Patient`, and `TranscriptResult`.
  - Relationships are defined for foreign keys (e.g., patients to clinics, transcripts to patients/veterinarians).
  - Enum types are used for status fields (e.g., `TaskStatus`).
  - All models are compatible with async database operations.

### schemas.py
- **Purpose:** Contains Pydantic models for request validation and response serialization.
- **Key Features:**
  - Defines input and output schemas for all resources (e.g., `VetInput`, `ClinicCreate`, `PatientOut`).
  - Uses `Optional`, `Dict`, and `Any` for flexible, explicit typing.
  - Response models include fields like `meta_data`, `error_message`, `created_at`, and `updated_at` where appropriate.
  - All schemas use `from_attributes = True` in their `Config` for ORM compatibility.
  - Ensures strict data validation for all API endpoints.

## Technologies Used
- **SQLAlchemy (async):** For ORM models and async database access.
- **Pydantic:** For data validation and serialization.
- **PostgreSQL:** (Recommended) as the backing database, but models are compatible with any SQLAlchemy-supported backend.

## Best Practices
- Keep business logic out of models and schemas; use them only for data structure and validation.
- Use explicit typing (`Optional`, `Dict`, `Any`) for all fields that may be nullable or flexible.
- Use enums for status fields to ensure data consistency.
- Use `from_attributes = True` in Pydantic models for seamless ORM integration.

## References
- See `../api/README.md` for API layer patterns.
- See `../utils/README.md` for utility functions (e.g., resiliency, logging, sanitization).
- See `database.py` and `schemas.py` in this folder for implementation details.
