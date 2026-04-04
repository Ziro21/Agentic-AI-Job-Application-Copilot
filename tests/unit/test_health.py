"""Smoke tests that do not require a database."""

from __future__ import annotations

from unittest.mock import MagicMock

from starlette.testclient import TestClient

from api.db import get_db
from api.main import app


def test_healthz() -> None:
    with TestClient(app) as client:
        r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_root_has_links() -> None:
    with TestClient(app) as client:
        r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert "links" in body
    assert "/docs" in body["links"].values() or "/docs" in str(body)


def test_readyz_ok() -> None:
    mock_db = MagicMock()
    mock_db.execute = MagicMock()

    def override_db() -> object:
        yield mock_db

    app.dependency_overrides[get_db] = override_db
    try:
        with TestClient(app) as client:
            r = client.get("/readyz")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ready"
        assert data["checks"]["database"] == "ok"
        assert data["service"] == "job-copilot-api"
        assert "no-store" in r.headers.get("cache-control", "")
    finally:
        app.dependency_overrides.clear()


def test_readyz_503_when_db_fails() -> None:
    mock_db = MagicMock()
    mock_db.execute = MagicMock(side_effect=RuntimeError("connection refused"))

    def override_db() -> object:
        yield mock_db

    app.dependency_overrides[get_db] = override_db
    try:
        with TestClient(app) as client:
            r = client.get("/readyz")
        assert r.status_code == 503
    finally:
        app.dependency_overrides.clear()
