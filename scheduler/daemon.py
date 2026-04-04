"""
Long-running scheduler using APScheduler (for VPS/container).

Run::

    python -m scheduler.daemon

Uses ``SCHEDULER_TIME_UTC`` (default ``06:30``) and triggers ``run_greenhouse_ingest`` daily.
Set ``SCHEDULER_ENABLED=false`` to exit immediately.
"""

from __future__ import annotations

import logging
import os
import signal
import sys
import time

logger = logging.getLogger(__name__)


def main() -> None:
    raw = os.getenv("SCHEDULER_ENABLED", "true").strip().lower()
    if raw in ("0", "false", "no", "off"):
        print("scheduler daemon: SCHEDULER_ENABLED is off", file=sys.stderr)
        return

    try:
        from logging_config import setup_logging

        setup_logging("scheduler-daemon")
    except Exception:  # noqa: BLE001
        logging.basicConfig(level=logging.INFO)

    from apscheduler.schedulers.blocking import BlockingScheduler
    from apscheduler.triggers.cron import CronTrigger

    from agents.greenhouse.collector import run_greenhouse_ingest

    time_str = os.getenv("SCHEDULER_TIME_UTC", "06:30").strip()
    try:
        hour_s, minute_s = time_str.split(":", 1)
        hour, minute = int(hour_s), int(minute_s)
    except ValueError:
        hour, minute = 6, 30
        logger.warning("Invalid SCHEDULER_TIME_UTC=%r, using 06:30", time_str)

    sched = BlockingScheduler(timezone="UTC")

    def job() -> None:
        logger.info("scheduled_ingest_trigger")
        summary = run_greenhouse_ingest()
        logger.info("scheduled_ingest_done %s", summary)

    sched.add_job(
        job,
        CronTrigger(hour=hour, minute=minute, timezone="UTC"),
        id="greenhouse_ingest",
        replace_existing=True,
    )

    def _stop(*_args: object) -> None:
        sched.shutdown(wait=False)
        sys.exit(0)

    signal.signal(signal.SIGTERM, _stop)
    signal.signal(signal.SIGINT, _stop)

    logger.info("scheduler_daemon listening daily at %02d:%02d UTC", hour, minute)
    sched.start()


if __name__ == "__main__":
    main()
