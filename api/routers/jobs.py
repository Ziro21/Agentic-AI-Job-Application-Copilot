from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.orm import Session

from api.db import get_db
from api.schemas import JobDetailOut, JobListItemOut, Paginated
from db.models import Application, Board, Company, Job


router = APIRouter(tags=["jobs"])


@router.get("/jobs", response_model=Paginated)
def list_jobs(
    q: str | None = None,
    min_score: int | None = Query(default=None, ge=0, le=100),
    is_active: bool | None = None,
    passed_filters_only: bool = False,
    page: int = 1,
    page_size: int = 20,
    sort: str = "score_desc",
    db: Session = Depends(get_db),
) -> Paginated:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)

    conditions = []
    if q:
        like = f"%{q.strip().lower()}%"
        conditions.append(
            or_(
                func.lower(Job.title).like(like),
                func.lower(Job.location_raw).like(like),
                func.lower(Job.content_text).like(like),
            )
        )
    if min_score is not None:
        conditions.append(Job.match_score >= min_score)
    if is_active is not None:
        conditions.append(Job.is_active.is_(is_active))
    if passed_filters_only:
        conditions.append(
            and_(Job.filter_is_uk.is_(True), Job.filter_is_entry_level.is_(True), Job.filter_is_ai_ml.is_(True))
        )

    where_clause = and_(*conditions) if conditions else None

    base = (
        select(
            Job.id,
            Job.title,
            Company.name.label("company_name"),
            Job.location_raw,
            Job.is_remote,
            Job.match_score,
            Job.filter_is_uk,
            Job.filter_is_entry_level,
            Job.filter_is_ai_ml,
            Job.last_seen_at,
            Job.updated_at_source,
            Job.is_active,
        )
        .join(Company, Company.id == Job.company_id)
    )
    if where_clause is not None:
        base = base.where(where_clause)

    if sort == "recent_desc":
        base = base.order_by(desc(Job.updated_at_source).nullslast(), desc(Job.last_seen_at))
    else:
        base = base.order_by(desc(Job.match_score), desc(Job.updated_at_source).nullslast(), desc(Job.last_seen_at))

    total_stmt = select(func.count()).select_from(Job).join(Company, Company.id == Job.company_id)
    if where_clause is not None:
        total_stmt = total_stmt.where(where_clause)
    total = db.execute(total_stmt).scalar_one()

    rows = db.execute(base.offset((page - 1) * page_size).limit(page_size)).all()
    items = [JobListItemOut.model_validate(dict(r._mapping)) for r in rows]
    return Paginated(items=items, total=total, page=page, page_size=page_size)


@router.get("/jobs/{job_id}", response_model=JobDetailOut)
def get_job(job_id: uuid.UUID, db: Session = Depends(get_db)) -> JobDetailOut:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    company = db.get(Company, job.company_id)
    board = db.get(Board, job.board_id) if job.board_id else None
    application = (
        db.execute(select(Application).where(Application.job_id == job.id).limit(1)).scalar_one_or_none()
    )

    return JobDetailOut(
        id=job.id,
        title=job.title,
        company=company,
        board=board,
        location_raw=job.location_raw,
        country=job.country,
        is_remote=job.is_remote,
        employment_type=job.employment_type,
        absolute_url=job.absolute_url,
        application_url=job.application_url,
        content_text=job.content_text,
        content_html=job.content_html,
        filter_is_uk=job.filter_is_uk,
        filter_is_entry_level=job.filter_is_entry_level,
        filter_is_ai_ml=job.filter_is_ai_ml,
        filter_reasons=job.filter_reasons or [],
        match_score=job.match_score,
        match_reasons=job.match_reasons or [],
        updated_at_source=job.updated_at_source,
        last_seen_at=job.last_seen_at,
        is_active=job.is_active,
        application=application,
    )

