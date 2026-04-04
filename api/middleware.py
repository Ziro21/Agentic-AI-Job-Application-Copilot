import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from logging_config import request_id_ctx_var

class RequestTrackingMiddleware(BaseHTTPMiddleware):
    """Correlates all logs back to a unique Request ID for high-visibility debugging."""
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = request_id_ctx_var.set(request_id)
        
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            request_id_ctx_var.reset(token)
