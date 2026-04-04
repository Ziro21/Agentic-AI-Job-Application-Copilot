"""
Celery task definitions for the Agentic Job Application Copilot.

Tasks:
- scheduled_greenhouse_ingest: Daily periodic task triggered by Celery Beat
- async_scrape_board: On-demand single-board scrape (for Celery worker distribution)
"""

import logging
import time

from agents.core.celery_app import celery_app
from db.session import SessionLocal

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Periodic Task: Full Greenhouse Ingest (triggered by Celery Beat)
# ---------------------------------------------------------------------------
@celery_app.task(
    bind=True,
    name="agents.core.tasks.scheduled_greenhouse_ingest",
    max_retries=3,
    default_retry_delay=300,      # 5 minutes between retries
    acks_late=True,               # Only ACK after success (crash-safe)
    reject_on_worker_lost=True,   # Re-queue if worker dies mid-task
    time_limit=3600,              # Hard kill after 1 hour
    soft_time_limit=3000,         # Graceful shutdown warning at 50 minutes
)
def scheduled_greenhouse_ingest(self):
    """
    Full Greenhouse ingest across all configured board tokens.

    Triggered daily by Celery Beat at the time configured in settings.yaml.
    Can also be triggered manually via:
        celery -A agents.core.celery_app call agents.core.tasks.scheduled_greenhouse_ingest
    """
    task_id = self.request.id
    logger.info(
        "scheduled_greenhouse_ingest START task_id=%s attempt=%d/%d",
        task_id, self.request.retries + 1, self.max_retries + 1,
    )

    t0 = time.perf_counter()
    try:
        from agents.greenhouse.collector import run_greenhouse_ingest

        result = run_greenhouse_ingest()

        duration_s = round(time.perf_counter() - t0, 1)
        logger.info(
            "scheduled_greenhouse_ingest COMPLETE task_id=%s duration_s=%.1f status=%s "
            "boards=%s fetched=%s created=%s updated=%s errors=%s",
            task_id,
            duration_s,
            result.get("status"),
            result.get("boards_checked"),
            result.get("jobs_fetched"),
            result.get("jobs_created"),
            result.get("jobs_updated"),
            result.get("errors_count"),
        )
        return result

    except Exception as exc:
        duration_s = round(time.perf_counter() - t0, 1)
        logger.error(
            "scheduled_greenhouse_ingest FAILED task_id=%s duration_s=%.1f error=%s",
            task_id, duration_s, exc,
        )
        raise self.retry(exc=exc)


# ---------------------------------------------------------------------------
# On-Demand Task: Single Board Scrape (for distributed worker execution)
# ---------------------------------------------------------------------------
@celery_app.task(
    bind=True,
    name="agents.core.tasks.async_scrape_board",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
    time_limit=600,               # 10-minute hard limit per board
    soft_time_limit=540,
)
def async_scrape_board(self, board_source: str, board_token: str):
    """
    Scrape a single ATS board asynchronously via Celery worker.

    Args:
        board_source: Adapter type — "greenhouse", "workday", or "lever"
        board_token: The board identifier/token
    """
    logger.info(
        "async_scrape_board START source=%s token=%s task_id=%s",
        board_source, board_token, self.request.id,
    )

    db = SessionLocal()
    try:
        from agents.core.unified import execute_adapter_ingestion

        if board_source == "workday":
            from agents.workday.adapter import WorkdayAdapter
            adapter = WorkdayAdapter()
        elif board_source == "lever":
            from agents.lever.adapter import LeverAdapter
            adapter = LeverAdapter()
        else:
            from agents.greenhouse.adapter import GreenhouseAdapter
            adapter = GreenhouseAdapter()

        execute_adapter_ingestion(db, adapter, board_token)
        logger.info(
            "async_scrape_board COMPLETE source=%s token=%s",
            board_source, board_token,
        )

    except Exception as exc:
        logger.error(
            "async_scrape_board FAILED source=%s token=%s error=%s",
            board_source, board_token, exc,
        )
        db.rollback()
        raise self.retry(exc=exc)

    finally:
        db.close()
