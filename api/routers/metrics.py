"""Operational summary for dashboards and monitoring."""

from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, Response
from prometheus_client import CONTENT_TYPE_LATEST, Gauge, generate_latest
from sqlalchemy import and_, desc, func, select
from sqlalchemy.orm import Session

from api.db import get_db
from api.schemas import RunLogOut
from api.auth import get_current_user
from db.models import Job, RunLog, Application, User

router = APIRouter(tags=["metrics"])


@router.get("/metrics/summary")
def metrics_summary(db: Session = Depends(get_db)) -> dict:
    """
    Aggregate counts and last ingest health.

    - ``jobs_total`` / ``jobs_active`` / ``jobs_passing_filters``
    - ``jobs_seen_last_7d``: jobs with ``last_seen_at`` in the last 7 days
    - ``last_run``: latest ``run_logs`` row (same shape as ``/api/runs/latest``)
    """
    total = db.execute(select(func.count()).select_from(Job)).scalar_one()
    active = db.execute(
        select(func.count()).select_from(Job).where(Job.is_active.is_(True))
    ).scalar_one()
    passing = db.execute(
        select(func.count())
        .select_from(Job)
        .where(
            and_(
                Job.filter_is_uk.is_(True),
                Job.filter_is_entry_level.is_(True),
                Job.filter_is_ai_ml.is_(True),
                Job.is_active.is_(True),
            )
        )
    ).scalar_one()

    cutoff = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=7)
    seen_7d = db.execute(
        select(func.count()).select_from(Job).where(Job.last_seen_at >= cutoff)
    ).scalar_one()

    row = db.execute(select(RunLog).order_by(desc(RunLog.started_at)).limit(1)).scalar_one_or_none()
    last_run = RunLogOut.model_validate(row) if row else None

    return {
        "jobs_total": int(total or 0),
        "jobs_active": int(active or 0),
        "jobs_passing_filters": int(passing or 0),
        "jobs_seen_last_7d": int(seen_7d or 0),
        "last_run": last_run.model_dump() if last_run else None,
    }


jobs_total_gauge = Gauge("jobs_total", "Total jobs in database")
jobs_active_gauge = Gauge("jobs_active", "Active jobs in database")
jobs_passing_gauge = Gauge("jobs_passing", "Jobs passing all filters")


@router.get("/metrics")
def get_prometheus_metrics(db: Session = Depends(get_db)):
    """Standard Prometheus metrics export endpoint."""
    total = db.execute(select(func.count()).select_from(Job)).scalar_one()
    active = db.execute(select(func.count()).select_from(Job).where(Job.is_active.is_(True))).scalar_one()
    passing = db.execute(
        select(func.count())
        .select_from(Job)
        .where(
            and_(
                Job.filter_is_uk.is_(True),
                Job.filter_is_entry_level.is_(True),
                Job.filter_is_ai_ml.is_(True),
                Job.is_active.is_(True),
            )
        )
    ).scalar_one()

    jobs_total_gauge.set(total)
    jobs_active_gauge.set(active)
    jobs_passing_gauge.set(passing)

    data = generate_latest()
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)


@router.get("/metrics/funnel")
def user_career_funnel(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    """Expert Analytics mapping user progression rates comprehensively across the job pipeline lifecycle."""
    rows = db.execute(
        select(Application.status, func.count(Application.id))
        .where(Application.user_id == current_user.id)
        .group_by(Application.status)
    ).all()
    
    funnel = {
        "saved": 0,
        "applied": 0,
        "oa": 0,
        "interview": 0,
        "offer": 0,
        "rejected": 0,
        "no_response": 0
    }
    for status_str, count in rows:
        if status_str in funnel:
            funnel[status_str] = count
            
    total_active_pipeline = funnel["applied"] + funnel["oa"] + funnel["interview"]
    total_historical = sum(funnel.values())
    
    return {
        "funnel": funnel,
        "conversion_rates": {
            "applied_to_interview": round((funnel["interview"] / funnel["applied"]) * 100, 2) if funnel["applied"] else 0.0,
            "interview_to_offer": round((funnel["offer"] / funnel["interview"]) * 100, 2) if funnel["interview"] else 0.0
        },
        "total_active_pipeline": total_active_pipeline,
        "total_historical": total_historical
    }
