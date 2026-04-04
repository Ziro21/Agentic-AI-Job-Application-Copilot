"""Unit tests for ingest webhook alerts (no real HTTP)."""

from __future__ import annotations

import datetime as dt
import json
import uuid
from unittest.mock import MagicMock, patch

import pytest

from agents.greenhouse.alerts import maybe_alert_on_run
from db.models import RunLog


def _run_log_partial() -> RunLog:
    return RunLog(
        id=uuid.uuid4(),
        run_type="greenhouse_ingest",
        status="partial",
        started_at=dt.datetime.now(dt.timezone.utc),
        boards_checked=10,
        jobs_fetched=100,
        jobs_created=1,
        jobs_updated=99,
        jobs_deactivated=0,
        errors_count=2,
        errors_sample=["board_error token=x", "board_error token=y"],
    )


@patch("agents.greenhouse.alerts.urllib.request.urlopen")
def test_maybe_alert_skips_without_url(mock_urlopen: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("ALERT_WEBHOOK_URL", raising=False)
    maybe_alert_on_run(_run_log_partial())
    mock_urlopen.assert_not_called()


@patch("agents.greenhouse.alerts.urllib.request.urlopen")
def test_maybe_alert_skips_success(mock_urlopen: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://example.com/hook")
    log = _run_log_partial()
    log.status = "success"
    maybe_alert_on_run(log)
    mock_urlopen.assert_not_called()


@patch("agents.greenhouse.alerts.urllib.request.urlopen")
def test_maybe_alert_posts_json(mock_urlopen: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://example.com/hook")
    monkeypatch.setenv("ALERT_WEBHOOK_FORMAT", "json")
    cm = MagicMock()
    cm.__enter__.return_value.status = 200
    cm.__exit__.return_value = None
    mock_urlopen.return_value = cm

    maybe_alert_on_run(_run_log_partial())

    mock_urlopen.assert_called_once()
    req = mock_urlopen.call_args[0][0]
    body = json.loads(req.data.decode())
    assert body["status"] == "partial"
    assert body["source"] == "job-copilot-ingest"
    assert body["errors_count"] == 2


@patch("agents.greenhouse.alerts.urllib.request.urlopen")
def test_maybe_alert_posts_slack_text(mock_urlopen: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://hooks.slack.com/services/x/y/z")
    monkeypatch.setenv("ALERT_WEBHOOK_FORMAT", "slack")
    cm = MagicMock()
    cm.__enter__.return_value.status = 200
    cm.__exit__.return_value = None
    mock_urlopen.return_value = cm

    maybe_alert_on_run(_run_log_partial())

    req = mock_urlopen.call_args[0][0]
    body = json.loads(req.data.decode())
    assert "text" in body
    assert "PARTIAL" in body["text"]


@patch("agents.greenhouse.alerts.urllib.request.urlopen")
def test_maybe_alert_respects_min_errors(mock_urlopen: MagicMock, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("ALERT_WEBHOOK_URL", "https://example.com/hook")
    monkeypatch.setenv("ALERT_MIN_ERRORS", "5")
    log = _run_log_partial()
    log.errors_count = 1
    maybe_alert_on_run(log)
    mock_urlopen.assert_not_called()
