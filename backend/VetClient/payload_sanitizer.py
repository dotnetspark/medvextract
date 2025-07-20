from enum import Enum


def sanitize_payload(obj):
    if isinstance(obj, dict):
        # Check if it's a Checked-style object with 'value' and 'checks'
        if 'value' in obj and isinstance(obj['value'], (str, int, float)):
            return obj['value']
        # Recursively sanitize dict
        return {k: sanitize_payload(v) for k, v in obj.items()}

    elif isinstance(obj, list):
        # Sanitize each item in list
        return [sanitize_payload(item) for item in obj]

    elif isinstance(obj, Enum):
        return obj.value.upper()

    elif hasattr(obj, 'model_dump'):
        # If it's a Pydantic model, dump it to dict then sanitize
        return sanitize_payload(obj.model_dump())

    # Primitive types are returned as-is
    return obj
