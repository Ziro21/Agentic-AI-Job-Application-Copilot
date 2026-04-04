import logging
from sqlalchemy.orm import Session
from agents.core.adapter import BaseATSAdapter
from agents.greenhouse.collector import _upsert_job, _sync_greenhouse_job_source

logger = logging.getLogger(__name__)

def execute_adapter_ingestion(db: Session, adapter: BaseATSAdapter, board_token: str) -> None:
    """Dynamically route execution to any configured ATS Adapter, mapping JSON/DOM natively down into the DB."""
    logger.info(f"Initiating native {adapter.source_type.upper()} ingestion for board [{board_token}]...")
    
    try:
        raw_jobs = adapter.fetch_jobs(board_token)
        logger.info(f"Adapter successfully hijacked {len(raw_jobs)} raw schemas.")
        
        for raw in raw_jobs:
            payload = adapter.parse_job(raw, board_token)
            if not payload.external_job_id:
                continue
                
            # Utilize the central DB upsert layout natively (decoupled from Greenhouse specifics)
            job, created = _upsert_job(db, payload)
            
            # Map structural persistence 
            _sync_greenhouse_job_source(db, job.id, payload.absolute_url)
            
        db.commit()
        logger.info(f"Successfully processed {len(raw_jobs)} objects via strictly typed {adapter.source_type} pipelines.")

    except Exception as e:
        logger.error(f"Global adapter execution sequence derailed for {board_token} on {adapter.source_type}: {e}")
        db.rollback()
