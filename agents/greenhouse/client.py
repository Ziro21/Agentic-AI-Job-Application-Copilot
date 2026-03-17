from __future__ import annotations

import time
from typing import Any, Dict, List

import requests
from requests import Response

from config import get_cached_config


class GreenhouseClientError(Exception):
    """Raised when a Greenhouse API request fails after retries."""

    pass


class GreenhouseClient:
    """HTTP client for Greenhouse Job Board API."""

    BASE_URL = "https://boards-api.greenhouse.io/v1/boards"

    def __init__(self, timeout: int = 30, delay: float = 1, max_retries: int = 3) -> None:
        cfg = get_cached_config()
        env = cfg.get("env", {})
        settings = cfg.get("settings", {})

        gh_settings = settings.get("sources", {}).get("greenhouse", {})
        self.board_tokens: List[str] = gh_settings.get("board_tokens", [])

        self.timeout = float(env.get("GREENHOUSE_REQUEST_TIMEOUT", timeout))
        self.delay = float(env.get("GREENHOUSE_REQUEST_DELAY", delay))
        self.max_retries = max_retries

    def _request_with_retry(self, url: str) -> Response:
        last_exc: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = requests.get(url, timeout=self.timeout)
                if resp.status_code == 429:
                    # rate limited – backoff and retry
                    sleep_for = min(self.delay * attempt, 60)
                    time.sleep(sleep_for)
                    continue
                resp.raise_for_status()
                return resp
            except Exception as exc:  # noqa: BLE001
                last_exc = exc
                if attempt == self.max_retries:
                    break
                time.sleep(self.delay * attempt)
        raise GreenhouseClientError(f"Failed to GET {url}: {last_exc}")  # type: ignore[arg-type]

    def get_jobs(self, board_token: str, include_content: bool = True) -> Dict[str, Any]:
        """Fetch jobs list for a single Greenhouse board token."""
        content_flag = "true" if include_content else "false"
        url = f"{self.BASE_URL}/{board_token}/jobs?content={content_flag}"
        resp = self._request_with_retry(url)
        return resp.json()

