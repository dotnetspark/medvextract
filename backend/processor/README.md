# Veterinary Transcript Processor – Technical Documentation

## Overview
`vet_transcript_processor.py` is an **asynchronous Celery task module** for handling veterinary consult transcripts.  
It validates, stores, processes, and extracts structured medical records from raw transcript text.

It coordinates:
- **Celery** for background job execution
- **Redis** for caching and as a Celery broker/backend
- **SQLAlchemy async ORM** for PostgreSQL
- **BAML Async Client** for AI-powered extraction (`VetOutput`)
- **Pydantic v2** for schema validation
- **Robust logging** and **error handling**

---

## Workflow
1. **Receive Transcript (VetInput)**  
   A `VetInput` payload is passed from your API layer to Celery. It contains the transcript text, optional notes, and patient/clinic/vet metadata.

2. **Cache Key Generation**  
   Input is serialized to deterministic JSON and hashed (MD5) to produce `cache_key`.

3. **Redis Cache Check**  
   If an identical input was processed within the last 24 hours, the cached result is returned immediately.

4. **Database Insert**  
   A new `TranscriptResult` row is inserted into Postgres with:
   - Status: `PENDING`
   - Full input metadata

5. **AI Extraction**  
   `b.ExtractVetTasks(vet_input)` is called asynchronously.  
   Output is a validated `VetOutput` model.

6. **Output Sanitization**  
   A recursive sanitization removes Pydantic wrappers and serializes enums to uppercase strings.

7. **Database Update**  
   The same row is updated with:
   - Raw model output
   - Sanitized result
   - Status: `COMPLETED`

8. **Cache Store**  
   Sanitized output is cached in Redis with a TTL of 24 hours.

9. **Error Handling**  
   - On error, DB row is updated to `FAILED`
   - Error message stored in `error_message` column
   - Exception logged with traceback

---

## Data Models

### Input: `VetInput`
| Field           | Type    | Description |
|-----------------|---------|-------------|
| transcript      | str     | Raw consult text |
| notes           | str?    | Optional clinician notes |
| patient_id      | str     | Patient unique ID |
| consult_date    | date    | Consultation date (ISO 8601) |
| veterinarian_id | str     | Veterinarian unique ID |
| clinic_id       | str     | Clinic unique ID |
| template_id     | str     | SOAP template ID |
| language        | str     | "EN", "ES", etc. |

### Output: `VetOutput`
- `follow_up_tasks[]`
- `medication_instructions[]`
- `client_reminders[]`
- `vet_todos[]`
- `soap_notes[]`
- `warnings[]`

---

## Dependencies
- Python 3.10+
- Celery
- redis-py
- SQLAlchemy async + asyncpg
- Pydantic v2
- baml_client
- PostgreSQL

---

## Environment Variables
| Variable   | Description |
|------------|-------------|
| `REDIS_URL` | Redis broker/backend URL (`redis://localhost:6379/0`) |
| `POSTGRES_*` | Standard PostgreSQL connection vars |

---

## Adapting to Another Language
To port this logic to Go, Java, Node, etc.:
1. Implement equivalent **input** (`VetInput`) & **output** (`VetOutput`) schemas.
2. Use a background worker with Redis-compatible queuing.
3. Choose a Redis client and replicate get/setex logic.
4. Choose a Postgres ORM/driver that supports JSONB.
5. Call your AI/ML backend to produce structured results.
6. Store both raw & sanitized results in the DB.

---

## Sanitization Rules
1. Pydantic models → `dict`
2. Enums → `.value` (string, uppercase)
3. Lists → recursive sanitation
4. Dicts → recursive sanitation

---

## Example Flow (pseudo-code)

```python
function process_task(input):
    # Generate a deterministic cache key
    cache_key = md5_hash(serialize(input))

    # Check Redis cache
    cached_result = redis.get(cache_key)
    if cached_result:
        return cached_result

    # Insert initial record into DB
    db.insert_transcript(task_id, input, status=PENDING)

    # Call AI model for extraction
    result = AI.extract_tasks(input)
    sanitized = sanitize(result)

    # Update DB with final result
    db.update_transcript(task_id, sanitized, status=COMPLETED)

    # Cache the sanitized result for 24h
    redis.setex(cache_key, 24h, sanitized)

    return sanitized

