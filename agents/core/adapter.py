import abc
from typing import List, Any
from agents.core.schema import JobIngestPayload

class BaseATSAdapter(abc.ABC):
    @property
    @abc.abstractmethod
    def source_type(self) -> str:
        """Return the string identifier for the ATS (e.g. 'lever', 'workday', 'greenhouse')"""
        pass

    @abc.abstractmethod
    def fetch_jobs(self, board_identifier: str) -> List[Any]:
        """Fetch raw job listing payloads natively from the target ATS"""
        pass

    @abc.abstractmethod
    def parse_job(self, raw: Any, board_token: str) -> JobIngestPayload:
        """Parse strict ATS outputs cleanly into the core ML pipeline schema"""
        pass
