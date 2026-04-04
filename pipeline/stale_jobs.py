"""Stale job lifecycle: increment missed_runs when URL not seen in an ingest run."""

from __future__ import annotations

import datetime as dt
from typing import Set

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from db.models import Job


def apply_stale_after_ingest(
    db: Session,
    seen_urls: Set[str],
    *,
    stale_threshold: int,
    run_started_at: dt.datetime,
) -> int:
    """
    After processing all boards for one ingest run:

    - Jobs returned this run are reset via upsert (``missed_runs=0``, ``is_active=True``).
    - Greenhouse jobs **not** in ``seen_urls`` get ``missed_runs += 1``.
    - Jobs with ``missed_runs >= stale_threshold`` are set ``is_active = False``.

    Returns how many jobs transitioned to inactive in this pass.
    """
    _ = run_started_at
    if stale_threshold <= 0:
        return 0

    seen_list = list(seen_urls)
    if seen_list:
        db.execute(
            update(Job)
            .where(Job.external_source == "greenhouse")
            .where(Job.absolute_url.notin_(seen_list))
            .values(missed_runs=Job.missed_runs + 1)
        )
    else:
        db.execute(
            update(Job)
            .where(Job.external_source == "greenhouse")
            .values(missed_runs=Job.missed_runs + 1)
        )

    to_close = db.execute(
        select(func.count())
        .select_from(Job)
        .where(
            Job.external_source == "greenhouse",
            Job.is_active.is_(True),
            Job.missed_runs >= stale_threshold,
        )
    ).scalar_one()

    deactivated = int(to_close or 0)
    if deactivated:
        db.execute(
            update(Job)
            .where(Job.external_source == "greenhouse")
            .where(Job.missed_runs >= stale_threshold)
            .values(is_active=False)
        )
    return deactivated
