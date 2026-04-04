import httpx
from typing import List, Any
import datetime
from agents.core.adapter import BaseATSAdapter
from agents.core.schema import JobIngestPayload
from pipeline.normalize_location import normalize_location

class LeverAdapter(BaseATSAdapter):
    @property
    def source_type(self) -> str:
        return "lever"

    def fetch_jobs(self, board_identifier: str) -> List[Any]:
        # Lever exposes public unauthenticated JSON feeds natively globally
        url = f"https://api.lever.co/v0/postings/{board_identifier}"
        with httpx.Client(timeout=30.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
            return resp.json()

    def parse_job(self, raw: Any, board_token: str) -> JobIngestPayload:
        job_id = raw.get("id", "")
        title = raw.get("text", "")
        categories = raw.get("categories", {})
        location_raw = categories.get("location", "")
        country, is_remote = normalize_location(location_raw)
        
        if categories.get("workplaceType", "").lower() == "remote":
            is_remote = True

        absolute_url = raw.get("hostedUrl", "")
        updated_at_raw = raw.get("updatedAt")
        updated_at = None
        if updated_at_raw:
            try:
                if isinstance(updated_at_raw, (int, float)):
                    updated_at = datetime.datetime.fromtimestamp(updated_at_raw / 1000.0)
            except Exception:
                pass

        content_html = raw.get("descriptionPlain", "")
        
        board_url = f"https://jobs.lever.co/{board_token}"
        api_url = f"https://api.lever.co/v0/postings/{board_token}"
        
        return JobIngestPayload(
            external_job_id=job_id,
            title=title,
            location_raw=location_raw,
            country=country,
            is_remote=is_remote,
            absolute_url=absolute_url,
            updated_at_source=updated_at,
            content_html=content_html,
            company_name=board_token.title(),
            board_token=board_token,
            board_url=board_url,
            api_url=api_url,
        )
