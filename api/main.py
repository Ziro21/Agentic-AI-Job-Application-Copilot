from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, Response, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from api.db import get_db
from api.routers import applications, jobs, metrics, runs, boards, users, exports
from api.middleware import RequestTrackingMiddleware


app = FastAPI(
    title="Agentic AI Job Application Copilot API",
    version="0.1.0",
    description="REST API for job ingest, applications, and run logs. "
    "Liveness: GET /healthz. Readiness (DB): GET /readyz.",
)

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(RequestTrackingMiddleware)

from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend

@app.on_event("startup")
async def startup():
    FastAPICache.init(InMemoryBackend(), prefix="fastapi-cache")

import os
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    origins = [o.strip() for o in cors_origins_env.split(",")]
else:
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    """Liveness: process is up (no DB check)."""
    return {"status": "ok"}


@app.get("/readyz")
def readyz(response: Response, db: Session = Depends(get_db)) -> dict[str, str | dict[str, str]]:
    """Readiness: database accepts connections (use behind load balancers / K8s)."""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "service": "job-copilot-api",
            "checks": {"database": "ok"},
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail=f"database_unavailable: {exc}") from exc


@app.get("/")
def root() -> dict[str, str | dict[str, str]]:
    """Avoid bare 404 on API root; link to docs and health checks."""
    return {
        "service": "Agentic AI Job Application Copilot API",
        "links": {
            "docs": "/docs",
            "openapi": "/openapi.json",
            "healthz": "/healthz",
            "readyz": "/readyz",
        },
    }


app.include_router(runs.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(metrics.router, prefix="/api/v1")
app.include_router(boards.router, prefix="/api/v1")
app.include_router(exports.router, prefix="/api/v1")

# Expert Upgrade: Route all new foundational models over API V1 prefix
app.include_router(users.router, prefix="/api/v1/users")

