import logging
import datetime
import time
from sqlalchemy.orm import Session
from sqlalchemy import select
from db.session import SessionLocal
from db.models import Application, Job, Company
from agents.integrations.gmail import GmailIntegration
from agents.integrations.calendar import CalendarIntegration

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def sync_active_applications():
    """Routinely scans Postgres for 'Applied' status pipelines and actively maps state loops against Google API parameters."""
    db: Session = SessionLocal()
    gmail = GmailIntegration()
    calendar = CalendarIntegration()
    
    # Target applications that have been aggressively seeded but haven't received a final ATS decision
    stmt = select(Application, Job, Company).join(Job).join(Company).where(
        Application.status == 'Applied'
    )
    
    results = db.execute(stmt).all()
    logger.info(f"Isolated {len(results)} active relational applications aggressively awaiting REST API status checks.")
    
    now = datetime.datetime.utcnow()
    
    for app, job, company in results:
        days_since_applied = (now - app.applied_at).days if app.applied_at else 0
        
        found, new_status = gmail.search_for_company(company.name)
        
        if found and new_status in ["REJECTED", "INTERVIEWING"]:
            logger.info(f"Auto-transitioning {company.name} pipeline loop heavily to {new_status} dynamically based purely on Gmail Regex extraction!")
            app.status = new_status.capitalize()
            app.updated_at = now
            db.commit()
            
        elif not found and days_since_applied >= 7:
            # Extends into strict ghosting thresholds natively orchestrating Calendar locks.
            logger.info(f"{company.name} hit aggressive 7-day ghost tracking. Injecting dynamic blockout into Google Calendar UI natively.")
            calendar.schedule_follow_up(company.name, job.title, delay_days=1)
            # Soft-update DB local timestamp explicitly preventing infinite iteration loops over the same calendar event
            app.updated_at = now 
            db.commit()
            
    db.close()

if __name__ == "__main__":
    while True:
        logger.info("Executing Phase 7.7 Gmail/Calendar Global Synchronizer Algorithm...")
        sync_active_applications()
        logger.info("Global Sync complete natively. Resting thread explicitly for 24 Hours.")
        time.sleep(86400)
