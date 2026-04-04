import asyncio
import logging
import httpx
from sqlalchemy import select
from db.models import Job
from db.session import SessionLocal

logger = logging.getLogger(__name__)

async def _check_url_rot(client: httpx.AsyncClient, job: Job) -> bool:
    """Checks if a job URL is rotten (404). Returns True if rotten."""
    url = job.absolute_url
    try:
        resp = await client.head(url, timeout=10.0, follow_redirects=True)
        if resp.status_code == 404:
            return True
        # Explicit exception for standard Greenhouse "Job Not Found / Role Filled" redirects
        if resp.status_code == 200 and "boards.greenhouse.io" in str(resp.url).lower() and "/jobs/" not in str(resp.url).lower():
            # If the user is redirected to the main greenhouse careers page instead of the job detail
            return True
            
    except httpx.RequestError as exc:
        logger.warning("RequestError for %s: %s", url, exc)
        return True # Can't reach it, assume rottten
        
    return False

async def run_rot_checker() -> int:
    """
    Spawns async requests to validate the absolute_url of all active jobs.
    Auto-deactivates jobs that 404.
    Returns: int (number of deactivated jobs)
    """
    db = SessionLocal()
    
    # Grab all currently active jobs
    stmt = select(Job).where(Job.is_active == True)
    active_jobs = db.execute(stmt).scalars().all()
    
    deactivated_count = 0
    limits = httpx.Limits(max_connections=20, max_keepalive_connections=20)
    
    async with httpx.AsyncClient(limits=limits) as client:
        # Evaluate in batches of 20
        # This prevents maxing out open file descriptors and allows smooth DB commits
        for i in range(0, len(active_jobs), 20):
            batch = active_jobs[i:i+20]
            tasks = [_check_url_rot(client, job) for job in batch]
            results = await asyncio.gather(*tasks)
            
            for job, is_rotten in zip(batch, results):
                if is_rotten:
                    job.is_active = False
                    deactivated_count += 1
            
            db.commit()
            
    db.close()
    logger.info("Rot Checker finished. Deactivated %d dead jobs.", deactivated_count)
    return deactivated_count

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    asyncio.run(run_rot_checker())
