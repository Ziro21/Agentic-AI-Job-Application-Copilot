from dataclasses import dataclass
from datetime import datetime
from typing import Optional

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
