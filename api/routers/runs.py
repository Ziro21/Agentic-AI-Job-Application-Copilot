from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from api.db import get_db
from api.schemas import Paginated, RunLogOut
from db.models import RunLog


router = APIRouter(tags=["runs"])


@router.get("/runs/latest", response_model=RunLogOut | None)
def get_latest_run(db: Session = Depends(get_db)) -> RunLogOut | None:
    row = db.execute(select(RunLog).order_by(desc(RunLog.started_at)).limit(1)).scalar_one_or_none()
    if row is None:
        return None
    return RunLogOut.model_validate(row)


@router.get("/runs", response_model=Paginated)
def list_runs(page: int = 1, page_size: int = 20, db: Session = Depends(get_db)) -> Paginated:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 200)
    total = db.query(RunLog).count()
    rows = (
        db.execute(
            select(RunLog)
            .order_by(desc(RunLog.started_at))
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        .scalars()
        .all()
    )
    items = [RunLogOut.model_validate(r) for r in rows]
    return Paginated(items=items, total=total, page=page, page_size=page_size)

