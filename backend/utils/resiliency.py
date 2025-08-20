import functools
import logging
import asyncio
import pybreaker
from tenacity import AsyncRetrying, stop_after_attempt, wait_exponential, retry_if_exception_type

logger = logging.getLogger(__name__)

# Shared global circuit breaker instance with tuned params if you want
global_breaker = pybreaker.CircuitBreaker(
    fail_max=5,           # max consecutive failures before open
    reset_timeout=60,     # seconds until half-open retry allowed
    name="global_breaker"
)


def async_retry(attempts=3, wait_min=1, wait_max=10, exceptions=(Exception,)):
    """
    Retry with exponential backoff.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            async for attempt in AsyncRetrying(
                stop=stop_after_attempt(attempts),
                wait=wait_exponential(
                    multiplier=1, min=wait_min, max=wait_max),
                retry=retry_if_exception_type(exceptions),
                reraise=True
            ):
                with attempt:
                    logger.debug(
                        f"[Retry] Attempt {attempt.retry_state.attempt_number} for {func.__name__}")
                    return await func(*args, **kwargs)
        return wrapper
    return decorator


def async_circuit_breaker(breaker=global_breaker):
    """
    Async-friendly circuit breaker using pybreaker.call_async.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await breaker.call_async(func, *args, **kwargs)
            except pybreaker.CircuitBreakerError:
                logger.warning(
                    f"[CircuitBreaker] {breaker.name} OPEN — blocking call to {func.__name__}")
                raise
        return wrapper
    return decorator


def async_fallback(fallback_value=None, handler=None):
    """
    Fallback returns safe value or calls handler on exception.
    """
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                logger.exception(f"[Fallback] {func.__name__} failed")
                if handler:
                    return handler(e, *args, **kwargs)
                return fallback_value
        return wrapper
    return decorator


def resilient(
    breaker=global_breaker,
    retry_attempts=3,
    retry_wait_min=1,
    retry_wait_max=10,
    retry_exceptions=(Exception,),
    fallback_value=None,
    fallback_handler=None
):
    """
    Polly-style combined decorator: Retry -> CircuitBreaker -> Fallback.
    Decorator order changed so fallback can handle breaker open errors.
    """
    def decorator(func):
        decorated = async_retry(
            attempts=retry_attempts,
            wait_min=retry_wait_min,
            wait_max=retry_wait_max,
            exceptions=retry_exceptions
        )(func)
        decorated = async_circuit_breaker(breaker)(decorated)
        decorated = async_fallback(fallback_value, fallback_handler)(decorated)
        return decorated
    return decorator


# Optional helpers
def sanitize_input(value: str) -> str:
    """Basic input sanitization to avoid unsafe characters."""
    return value.strip().replace('<', '').replace('>', '')


class SafeLogger(logging.Logger):
    """Logger that redacts PHI/PII in info and error logs."""

    def info(self, msg, *args, **kwargs):
        if 'PHI' in msg or 'PII' in msg:
            msg = '[REDACTED]'
        super().info(msg, *args, **kwargs)

    def error(self, msg, *args, **kwargs):
        if 'PHI' in msg or 'PII' in msg:
            msg = '[REDACTED]'
        super().error(msg, *args, **kwargs)
