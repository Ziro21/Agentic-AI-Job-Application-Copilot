from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, joinedload

from api.db import get_db
from api.schemas import ApplicationOut, ApplicationUpsertIn, ApplicationWithJobOut, Paginated
from db.models import Application, Job


router = APIRouter(tags=["applications"])


@router.put("/jobs/{job_id}/application", response_model=ApplicationOut)
def upsert_application(
    job_id: uuid.UUID, payload: ApplicationUpsertIn, db: Session = Depends(get_db)
) -> ApplicationOut:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    app = db.execute(select(Application).where(Application.job_id == job_id).limit(1)).scalar_one_or_none()
    if app is None:
        app = Application(job_id=job_id)
        db.add(app)

    app.status = payload.status
    app.applied_at = payload.applied_at
    app.last_follow_up_at = payload.last_follow_up_at
    app.next_follow_up_at = payload.next_follow_up_at
    app.notes = payload.notes
    app.custom_fields = payload.custom_fields

    db.commit()
    db.refresh(app)
    return ApplicationOut.model_validate(app)


@router.get("/applications", response_model=Paginated)
def list_applications(
    status: str | None = None, page: int = 1, page_size: int = 50, db: Session = Depends(get_db)
) -> Paginated:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    stmt = select(Application)
    if status:
        stmt = stmt.where(Application.status == status)

    total_stmt = select(func.count()).select_from(Application)
    if status:
        total_stmt = total_stmt.where(Application.status == status)
    total = db.execute(total_stmt).scalar_one()

    stmt = stmt.options(joinedload(Application.job).joinedload(Job.company))
    rows = (
        db.execute(stmt.order_by(desc(Application.updated_at)).offset((page - 1) * page_size).limit(page_size))
        .scalars()
        .unique()
        .all()
    )
    items = [
        ApplicationWithJobOut(
            **ApplicationOut.model_validate(r).model_dump(),
            job_title=r.job.title if r.job else None,
            company_name=r.job.company.name if r.job and r.job.company else None,
        )
        for r in rows
    ]
    return Paginated(items=items, total=total, page=page, page_size=page_size)

