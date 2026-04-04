"""
One-shot scheduled ingest entrypoint.

Use with cron / launchd / systemd timer::

    cd /path/to/project && /path/to/venv/bin/python -m scheduler.run_daily

Respects:

- ``SCHEDULER_ENABLED`` — if ``false`` / ``0`` / ``no``, exits 0 without running.
- Logging via ``logging_config.setup_logging`` when available.

Exit codes: 0 success or skipped; 1 ingest status ``failed``.
"""

from __future__ import annotations

import os
import sys


def main() -> int:
    raw = os.getenv("SCHEDULER_ENABLED", "true").strip().lower()
    if raw in ("0", "false", "no", "off"):
        print("scheduler: SCHEDULER_ENABLED is off, skipping ingest", file=sys.stderr)
        return 0

    try:
        from logging_config import setup_logging

        setup_logging("scheduler-run-daily")
    except Exception:  # noqa: BLE001
        import logging

        logging.basicConfig(level=logging.INFO)

    from agents.greenhouse.collector import run_greenhouse_ingest
    from agents.greenhouse.rot_checker import run_rot_checker
    import asyncio
    import logging

    summary = run_greenhouse_ingest()
    
    logger = logging.getLogger("scheduler-run-daily")
    logger.info("Executing post-ingest Link Rot Decay checker...")
    try:
        asyncio.run(run_rot_checker())
    except Exception as e:
        logger.error("Link Rot Decay checker failed: %s", e)

    status = summary.get("status")
    if status == "failed":
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
