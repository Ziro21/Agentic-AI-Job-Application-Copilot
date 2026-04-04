import csv
import logging
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from api.db import get_db
from api.auth import get_current_user
from db.models import User, Application, Job

logger = logging.getLogger(__name__)

router = APIRouter(tags=["exports"])

def write_csv_to_disk(user_email: str, applications: list[Application], export_id: str) -> None:
    """Offline background task blocking I/O without degrading main FastAPI event loop."""
    logger.info("Initiating async CSV export id=%s for user=%s", export_id, user_email)
    
    exports_dir = Path(os.getcwd()) / "exports"
    exports_dir.mkdir(exist_ok=True)
    
    file_path = exports_dir / f"export_{user_email.replace('@', '_at_')}_{export_id}.csv"
    
    with file_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Title", "Company", "Status", "Applied At", "Application URL"])
        
        for app in applications:
            writer.writerow([
                app.job.title if app.job else "Unknown",
                app.job.company.name if app.job and app.job.company else "Unknown",
                app.status,
                app.applied_at.isoformat() if app.applied_at else "",
                app.job.application_url if app.job else ""
            ])
            
    logger.info("Successfully dropped background CSV to disk: %s", file_path)


@router.post("/exports/csv")
def request_csv_export(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """Queues a heavy job dataset export to the background processing queue dynamically."""
    apps = db.execute(
        select(Application)
        .where(Application.user_id == current_user.id)
        .options(joinedload(Application.job).joinedload(Job.company))
    ).scalars().unique().all()
    
    export_id = str(uuid.uuid4())[:8]
    
    # Hand the heavy I/O workload securely into the framework native worker process
    background_tasks.add_task(write_csv_to_disk, current_user.email, apps, export_id)
    
    return {
        "status": "queued",
        "export_id": export_id,
        "message": f"Generating CSV records asynchronously for {len(apps)} applications."
    }
