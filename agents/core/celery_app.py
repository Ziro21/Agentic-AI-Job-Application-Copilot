"""
Celery application configuration for the Agentic Job Application Copilot.

This module configures:
- Redis as the message broker and result backend
- Celery Beat periodic task schedule (reads daily_time_utc from settings.yaml)
- Serialization, timezone, retry, and task-tracking settings
"""

import logging
import os

from celery import Celery
from celery.schedules import crontab

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Core Celery app
# ---------------------------------------------------------------------------
celery_app = Celery(
    "copilot_tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2"),
)

# ---------------------------------------------------------------------------
# Parse schedule from settings.yaml (gracefully fallback to 10:30 UTC)
# ---------------------------------------------------------------------------
def _parse_schedule_time() -> tuple[int, int]:
    """Read daily_time_utc from settings.yaml, return (hour, minute)."""
    try:
        from config import get_scheduler_settings
        sched = get_scheduler_settings()
        time_str = sched.get("daily_time_utc", "10:30")
        parts = str(time_str).split(":")
        return int(parts[0]), int(parts[1])
    except Exception:
        logger.warning("Could not parse schedule from settings.yaml, defaulting to 10:30 UTC")
        return 10, 30


_hour, _minute = _parse_schedule_time()

# ---------------------------------------------------------------------------
# Celery configuration
# ---------------------------------------------------------------------------
celery_app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    # Timezone
    timezone="UTC",
    enable_utc=True,

    # Task tracking
    task_track_started=True,
    task_acks_late=True,                     # Re-deliver if worker crashes mid-task
    worker_prefetch_multiplier=1,            # Fair scheduling across workers

    # Retry
    task_default_retry_delay=300,            # 5-minute default retry backoff
    task_max_retries=3,

    # Broker
    broker_connection_retry_on_startup=True,
    broker_transport_options={
        "visibility_timeout": 3600,          # 1 hour — long enough for full ingest
    },

    # Result expiry
    result_expires=86400,                    # Results expire after 24 hours

    # Task discovery
    include=["agents.core.tasks"],

    # -----------------------------------------------------------------------
    # Celery Beat Schedule
    # -----------------------------------------------------------------------
    beat_schedule={
        "daily-greenhouse-ingest": {
            "task": "agents.core.tasks.scheduled_greenhouse_ingest",
            "schedule": crontab(hour=_hour, minute=_minute),
            "options": {
                "queue": "default",
                "expires": 3600,             # Task expires if not picked up within 1 hour
            },
        },
    },
    beat_schedule_filename=os.getenv(
        "CELERY_BEAT_SCHEDULE_DB",
        "/tmp/celerybeat-schedule",
    ),
)

logger.info("Celery Beat configured: daily ingest at %02d:%02d UTC", _hour, _minute)
