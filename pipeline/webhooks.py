import logging
import httpx
from typing import Any
from db.models import Job

logger = logging.getLogger(__name__)

async def dispatch_webhook_async(url: str, payload: dict[str, Any]) -> None:
    """Fires a POST webhook asynchronously directly to Slack/Zapier."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=5.0)
            resp.raise_for_status()
            logger.info("Successfully dispatched webhook to %s", url)
    except Exception as e:
        logger.warning("Failed to dispatch webhook to %s: %s", url, e)

def trigger_job_webhooks(db, job: Job) -> None:
    """Collects configured users and fires webhook payloads for high-quality jobs."""
    if job.match_score < 90:
        return # Only A-Tier alerts
        
    from sqlalchemy import select
    from db.models import UserProfile
    
    profiles = db.execute(select(UserProfile).where(UserProfile.webhook_url.isnot(None))).scalars().all()
    if not profiles:
        return
        
    payload = {
        "event": "new_job_alert",
        "job_id": str(job.id),
        "title": job.title,
        "company": job.company.name if job.company else "Unknown",
        "score": job.match_score,
        "url": job.absolute_url
    }
    
    import asyncio
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    for profile in profiles:
        coro = dispatch_webhook_async(profile.webhook_url, payload)
        if loop and loop.is_running():
            loop.create_task(coro)
        else:
            asyncio.run(coro)
