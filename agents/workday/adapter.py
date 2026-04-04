import json
from typing import List, Any
import logging
from agents.core.adapter import BaseATSAdapter
from agents.core.schema import JobIngestPayload
from agents.core.browser import HeadlessBrowserContext
from pipeline.normalize_location import normalize_location

logger = logging.getLogger(__name__)

class WorkdayAdapter(BaseATSAdapter):
    @property
    def source_type(self) -> str:
        return "workday"

    def fetch_jobs(self, board_identifier: str) -> List[Any]:
        # URL assumption: e.g. "nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite"
        url = f"https://{board_identifier}"
        logger.info(f"WorkdayAdapter initializing Playwright overlay onto: {url}")
        
        with HeadlessBrowserContext() as ctx:
            page = ctx.new_page()
            jobs = []
            
            try:
                # Intercept the JSON response Workday generates internally after CSRF validation
                with page.expect_response(lambda response: "wday/cxs" in response.url, timeout=15000) as response_info:
                    page.goto(url, wait_until="networkidle")
                    resp = response_info.value
                    data = resp.json()
                    if "jobPostings" in data:
                        jobs = data["jobPostings"]
            except Exception as e:
                logger.error(f"Playwright failed to resolve Workday CSRF tokens: {e}")
                
            return jobs

    def parse_job(self, raw: Any, board_token: str) -> JobIngestPayload:
        job_id = raw.get("id", "")
        title = raw.get("title", "")
        location_raw = raw.get("locationsText", "")
        country, is_remote = normalize_location(location_raw)
        
        absolute_url = f"https://{board_token}{raw.get('externalPath', '')}"
        updated_at_raw = raw.get("postedOn")
        
        content_html = "" 
        board_url = f"https://{board_token}"
        api_url = f"https://{board_token}/wday/cxs"
        
        return JobIngestPayload(
            external_job_id=job_id,
            title=title,
            location_raw=location_raw,
            country=country,
            is_remote=is_remote,
            absolute_url=absolute_url,
            updated_at_source=None,
            content_html=content_html,
            company_name=board_token.split(".")[0].title(),
            board_token=board_token,
            board_url=board_url,
            api_url=api_url,
        )
