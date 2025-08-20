# Resiliency & Security Utilities

This module provides generic, reusable patterns for resiliency and security in FastAPI and Python backend services. Use these utilities to ensure robust, secure, and HIPAA-compliant operations across your application.

## Features

### 1. Retry Policy (Exponential Backoff)
- Decorator: `@retryable()`
- Uses [tenacity](https://tenacity.readthedocs.io/) to automatically retry failed operations (e.g., external API calls, DB queries) with exponential backoff.
- Example:
  ```python
  from backend.utils.resiliency import retryable

  @retryable()
  async def call_external_service(...):
      ...
  ```

### 2. Circuit Breaker
- Decorator: `@circuit_breaker()`
- Uses [pybreaker](https://pypi.org/project/pybreaker/) to prevent repeated calls to failing services, improving system stability.
- Example:
  ```python
  from backend.utils.resiliency import circuit_breaker

  @circuit_breaker()
  async def call_unreliable_service(...):
      ...
  ```

### 3. Input Validation & Sanitization
- Function: `sanitize_input(value: str) -> str`
- Strips and removes potentially dangerous characters from user input.
- Example:
  ```python
  from backend.utils.resiliency import sanitize_input

  safe_value = sanitize_input(user_input)
  ```

### 4. HIPAA-Compliant Logging
- Class: `SafeLogger`
- Ensures logs do not contain PHI/PII by redacting sensitive messages.
- Example:
  ```python
  from backend.utils.resiliency import SafeLogger

  logger = SafeLogger(__name__)
  logger.info("Non-sensitive message")
  logger.error("PHI: Sensitive error")  # Will be redacted
  ```

## Usage
- Import and use these utilities in your routers, services, or anywhere you need resiliency and security.
- Combine decorators for maximum effect:
  ```python
  @retryable()
  @circuit_breaker()
  async def call_external(...):
      ...
  ```

## Requirements
- `tenacity` for retry logic
- `pybreaker` for circuit breaker

Install with:
```
pip install tenacity pybreaker
```

## Best Practices
- Use these patterns for all external service calls and user input handling.
- Always log only non-PHI/PII data.
- Use HTTPS in production.
