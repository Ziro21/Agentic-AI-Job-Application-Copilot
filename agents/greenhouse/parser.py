from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional

from pipeline.normalize_location import normalize_location


@dataclass
class JobIngestPayload:
    external_job_id: str
    title: str
    location_raw: Optional[str]
    country: Optional[str]
    is_remote: bool
    absolute_url: str
    updated_at_source: Optional[datetime]
    content_html: Optional[str]
    company_name: str
    board_token: str
    board_url: str
    api_url: str


def parse_job(raw: Dict[str, Any], board_token: str) -> JobIngestPayload:
    """Convert a single Greenhouse job JSON record into a canonical payload."""
    job_id = str(raw.get("id"))
    title = (raw.get("title") or "").strip()
    location = raw.get("location") or {}
    location_raw = location.get("name")
    country, is_remote = normalize_location(location_raw)
    absolute_url = (raw.get("absolute_url") or "").strip()
    updated_at_raw = raw.get("updated_at") or raw.get("updated_on")
    updated_at: Optional[datetime] = None
    if isinstance(updated_at_raw, str):
        try:
            updated_at = datetime.fromisoformat(updated_at_raw.replace("Z", "+00:00"))
        except ValueError:
            updated_at = None
    content_html = raw.get("content")

    company = raw.get("company") or {}
    company_name = (company.get("name") or raw.get("company_name") or "").strip()

    board_url = f"https://boards.greenhouse.io/{board_token}"
    api_url = f"https://boards-api.greenhouse.io/v1/boards/{board_token}/jobs"

    return JobIngestPayload(
        external_job_id=job_id,
        title=title,
        location_raw=location_raw,
        country=country,
        is_remote=is_remote,
        absolute_url=absolute_url,
        updated_at_source=updated_at,
        content_html=content_html,
        company_name=company_name,
        board_token=board_token,
        board_url=board_url,
        api_url=api_url,
    )

