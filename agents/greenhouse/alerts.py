"""Optional webhook notifications after ingest runs."""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request

from db.models import RunLog

logger = logging.getLogger(__name__)


def _json_payload(run_log: RunLog) -> dict:
    return {
        "source": "job-copilot-ingest",
        "run_id": str(run_log.id),
        "run_type": run_log.run_type,
        "status": run_log.status,
        "boards_checked": run_log.boards_checked,
        "jobs_fetched": run_log.jobs_fetched,
        "jobs_created": run_log.jobs_created,
        "jobs_updated": run_log.jobs_updated,
        "jobs_deactivated": run_log.jobs_deactivated,
        "errors_count": run_log.errors_count,
        "errors_sample": run_log.errors_sample[:5],
        "started_at": run_log.started_at.isoformat() if run_log.started_at else None,
        "ended_at": run_log.ended_at.isoformat() if run_log.ended_at else None,
    }


def _slack_text_payload(run_log: RunLog) -> dict:
    """Slack incoming webhooks expect ``{\"text\": \"...\"}`` (no secrets in body)."""
    lines = [
        f"*Job Copilot ingest — {run_log.status.upper()}* (`{run_log.run_type}`)",
        f"• run_id: `{run_log.id}`",
        f"• boards_checked: {run_log.boards_checked} | errors: {run_log.errors_count}",
        f"• jobs: fetched {run_log.jobs_fetched}, created {run_log.jobs_created}, updated {run_log.jobs_updated}, deactivated {run_log.jobs_deactivated}",
    ]
    sample = run_log.errors_sample[:3]
    if sample:
        lines.append("• sample errors:")
        for s in sample:
            lines.append(f"  - {s[:200]}")
    return {"text": "\n".join(lines)}


def maybe_alert_on_run(run_log: RunLog) -> None:
    """
    If ``ALERT_WEBHOOK_URL`` is set, POST when the run failed or was partial.

    Environment:

    - ``ALERT_MIN_ERRORS`` (default ``1``) — minimum ``errors_count`` for partial runs.
    - ``ALERT_WEBHOOK_FORMAT`` — ``json`` (default) or ``slack`` for Slack incoming webhooks.
    - ``ALERT_WEBHOOK_TIMEOUT`` — seconds (default ``15``).
    """
    url = os.getenv("ALERT_WEBHOOK_URL", "").strip()
    if not url:
        return

    if run_log.status not in ("failed", "partial"):
        return

    try:
        min_errors = int(os.getenv("ALERT_MIN_ERRORS", "1"))
    except ValueError:
        min_errors = 1
    if run_log.errors_count < min_errors:
        return

    fmt = os.getenv("ALERT_WEBHOOK_FORMAT", "json").strip().lower()
    if fmt in ("slack", "slack_incoming"):
        payload = _slack_text_payload(run_log)
    else:
        payload = _json_payload(run_log)

    try:
        timeout = float(os.getenv("ALERT_WEBHOOK_TIMEOUT", "15"))
    except ValueError:
        timeout = 15.0

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status >= 400:
                logger.warning("Alert webhook returned %s", resp.status)
            else:
                logger.debug("Alert webhook OK status=%s", resp.status)
    except urllib.error.URLError as exc:
        logger.warning("Alert webhook failed: %s", exc)
