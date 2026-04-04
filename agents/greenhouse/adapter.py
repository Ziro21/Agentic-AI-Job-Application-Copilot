from typing import List, Any
from agents.core.adapter import BaseATSAdapter
from agents.core.schema import JobIngestPayload
from agents.greenhouse.client import GreenhouseClient
from agents.greenhouse.parser import parse_job

class GreenhouseAdapter(BaseATSAdapter):
    @property
    def source_type(self) -> str:
        return "greenhouse"

    def fetch_jobs(self, board_identifier: str) -> List[Any]:
        client = GreenhouseClient()
        return client.fetch_jobs(board_identifier)

    def parse_job(self, raw: Any, board_token: str) -> JobIngestPayload:
        return parse_job(raw, board_token)
