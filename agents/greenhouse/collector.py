from __future__ import annotations

import logging
import sys
from typing import Any, Dict, List

from sqlalchemy import select
from sqlalchemy.orm import Session

from agents.greenhouse.client import GreenhouseClient, GreenhouseClientError
from agents.greenhouse.parser import JobIngestPayload, parse_job
from config import get_greenhouse_settings
from db.models import Application, Board, Company, Job, RunLog
from db.session import SessionLocal
from pipeline.filters import apply_filters
from pipeline.html_to_text import html_to_text
from pipeline.scoring import compute_score

logger = logging.getLogger(__name__)


def _get_or_create_company(db: Session, name: str) -> Company:
    normalized = name.strip().lower()
    if not normalized:
        normalized = "unknown"
        name = "Unknown"
    stmt = select(Company).where(Company.name_normalized == normalized)
    company = db.execute(stmt).scalar_one_or_none()
    if company:
        return company
    company = Company(name=name, name_normalized=normalized)
    db.add(company)
    db.flush()
    return company


def _get_or_create_board(db: Session, payload: JobIngestPayload) -> Board:
    stmt = select(Board).where(
        Board.source_type == "greenhouse",
        Board.token == payload.board_token,
    )
    board = db.execute(stmt).scalar_one_or_none()
    if board:
        return board
    board = Board(
        source_type="greenhouse",
        token=payload.board_token,
        board_url=payload.board_url,
        api_url=payload.api_url,
        is_active=True,
    )
    db.add(board)
    db.flush()
    return board


def _upsert_job(db: Session, payload: JobIngestPayload) -> tuple[Job, bool]:
    """Upsert a job by absolute_url. Returns (job, created?)."""
    stmt = select(Job).where(Job.absolute_url == payload.absolute_url)
    job = db.execute(stmt).scalar_one_or_none()

    created = False
    company = _get_or_create_company(db, payload.company_name)
    board = _get_or_create_board(db, payload)

    content_text = html_to_text(payload.content_html)
    filters = apply_filters(payload.title, payload.location_raw, content_text)
    score_res = compute_score(payload.title, payload.location_raw, content_text)

    if job is None:
        job = Job(
            company_id=company.id,
            board_id=board.id,
            external_source="greenhouse",
            external_job_id=payload.external_job_id,
            title=payload.title,
            title_normalized=payload.title.strip().lower(),
            location_raw=payload.location_raw,
            location_normalized=(payload.location_raw or "").strip().lower() or None,
            absolute_url=payload.absolute_url,
            application_url=payload.absolute_url,
            content_html=payload.content_html,
            content_text=content_text,
            updated_at_source=payload.updated_at_source,
            filter_is_uk=filters.is_uk,
            filter_is_entry_level=filters.is_entry_level,
            filter_is_ai_ml=filters.is_ai_ml,
            filter_reasons=filters.reasons,
            match_score=score_res.score,
            match_reasons=score_res.reasons,
            is_active=True,
        )
        db.add(job)
        created = True
    else:
        job.company_id = company.id
        job.board_id = board.id
        job.external_source = "greenhouse"
        job.external_job_id = payload.external_job_id
        job.title = payload.title
        job.title_normalized = payload.title.strip().lower()
        job.location_raw = payload.location_raw
        job.location_normalized = (payload.location_raw or "").strip().lower() or None
        job.content_html = payload.content_html
        job.content_text = content_text
        job.updated_at_source = payload.updated_at_source
        job.filter_is_uk = filters.is_uk
        job.filter_is_entry_level = filters.is_entry_level
        job.filter_is_ai_ml = filters.is_ai_ml
        job.filter_reasons = filters.reasons
        job.match_score = score_res.score
        job.match_reasons = score_res.reasons
        job.is_active = True

    db.flush()
    return job, created


def run_greenhouse_ingest() -> Dict[str, Any]:
    """Run a single Greenhouse ingest across all configured board tokens."""
    gh_settings = get_greenhouse_settings()
    enabled = gh_settings.get("enabled", True)
    tokens: List[str] = gh_settings.get("board_tokens", [])

    if not enabled or not tokens:
        logger.info("Greenhouse ingest disabled or no board tokens configured.")
        return {"status": "skipped", "reason": "disabled_or_no_tokens"}

    client = GreenhouseClient()

    db = SessionLocal()
    run_log = RunLog(
        run_type="greenhouse_ingest",
        status="success",
    )
    db.add(run_log)
    db.flush()

    boards_checked = 0
    jobs_fetched = 0
    jobs_created = 0
    jobs_updated = 0
    errors: List[str] = []

    try:
        logger.info("Starting ingest for %d board(s)...", len(tokens))
        for i, token in enumerate(tokens, 1):
            try:
                logger.info("[%d/%d] Fetching %s...", i, len(tokens), token)
                data = client.get_jobs(token, include_content=True)
                raw_jobs = data.get("jobs", [])
                boards_checked += 1
                jobs_fetched += len(raw_jobs)

                for raw in raw_jobs:
                    try:
                        payload = parse_job(raw, token)
                        _, created = _upsert_job(db, payload)
                        if created:
                            jobs_created += 1
                        else:
                            jobs_updated += 1
                    except Exception as job_exc:  # noqa: BLE001
                        msg = f"job_error token={token} id={raw.get('id')}: {job_exc}"
                        logger.exception(msg)
                        errors.append(msg)
                db.commit()
                logger.info("  -> %d jobs (total created=%d, updated=%d)", len(raw_jobs), jobs_created, jobs_updated)
            except GreenhouseClientError as client_exc:
                msg = f"board_error token={token}: {client_exc}"
                logger.warning("  -> SKIP %s: %s", token, client_exc)
                errors.append(msg)
                db.rollback()
    except Exception as exc:  # noqa: BLE001
        logger.exception("Greenhouse ingest failed with unexpected error: %s", exc)
        run_log.status = "failed"
    else:
        if errors:
            run_log.status = "partial"
        else:
            run_log.status = "success"
    finally:
        run_log.boards_checked = boards_checked
        run_log.jobs_fetched = jobs_fetched
        run_log.jobs_created = jobs_created
        run_log.jobs_updated = jobs_updated
        run_log.jobs_deactivated = 0
        run_log.errors_count = len(errors)
        run_log.errors_sample = errors[:5]
        db.commit()
        db.close()

    return {
        "status": run_log.status,
        "boards_checked": boards_checked,
        "jobs_fetched": jobs_fetched,
        "jobs_created": jobs_created,
        "jobs_updated": jobs_updated,
        "errors_count": len(errors),
    }


if __name__ == "__main__":
    # Unbuffer stdout/stderr so progress appears immediately
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(line_buffering=True)
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(line_buffering=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%H:%M:%S",
    )
    summary = run_greenhouse_ingest()
    logger.info("Greenhouse ingest summary: %s", summary)

