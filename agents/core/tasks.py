from agents.core.celery_app import celery_app
from agents.core.unified import execute_adapter_ingestion
from sqlalchemy.orm import Session
from db.session import SessionLocal
import logging

logger = logging.getLogger(__name__)

@celery_app.task(bind=True, max_retries=3)
def async_scrape_board(self, board_source: str, board_token: str):
    """
    Distributes heavy scraping operations natively tracking Playwright failures across isolation nodes.
    Restarts gracefully across crashes leveraging Celery Message Queues.
    """
    logger.info(f"Celery Execution Triggered -> Injecting {board_source} ATS adapter against [{board_token}] natively.")
    db: Session = SessionLocal()
    
    try:
        if board_source == "workday":
            from agents.workday.adapter import WorkdayAdapter
            adapter = WorkdayAdapter()
        elif board_source == "lever":
            from agents.lever.adapter import LeverAdapter
            adapter = LeverAdapter()
        else:
            from agents.greenhouse.adapter import GreenhouseAdapter
            adapter = GreenhouseAdapter()
            
        execute_adapter_ingestion(db, adapter, board_token)
        logger.info(f"Celery Worker successfully terminated payload routing for {board_token}.")
        
    except Exception as exc:
        logger.error(f"Celery Thread caught systemic crash parsing ATS ({exc}). Attempting 60 second fault restart...")
        db.rollback()
        raise self.retry(exc=exc, countdown=60)
        
    finally:
        db.close()
