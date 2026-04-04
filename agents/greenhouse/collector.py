from __future__ import annotations

import datetime as dt
import logging
import os
import sys
import time
import uuid
from typing import Any, Dict, List, Set

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from agents.greenhouse.alerts import maybe_alert_on_run
from agents.greenhouse.client import GreenhouseClient, GreenhouseClientError, GreenhouseBoardNotFoundError
from agents.greenhouse.parser import JobIngestPayload, parse_job
from config import get_greenhouse_settings, get_scheduler_settings
from db.models import Board, Company, Job, JobSource, RunLog
from db.session import SessionLocal
from pipeline.dedupe import (
    compute_content_hash,
    compute_dedupe_key_secondary,
    normalize_text_for_content_hash,
)
from pipeline.filters import apply_filters
from pipeline.html_to_text import html_to_text
from pipeline.scoring import compute_score
from pipeline.stale_jobs import apply_stale_after_ingest

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


def _sync_greenhouse_job_source(db: Session, job_id: uuid.UUID, absolute_url: str) -> None:
    """Record or refresh Greenhouse discovery URL for this job."""
    stmt = select(JobSource).where(
        JobSource.source_type == "greenhouse",
        JobSource.source_url == absolute_url,
    )
    row = db.execute(stmt).scalar_one_or_none()
    now = dt.datetime.now(dt.timezone.utc)
    if row is None:
        db.add(JobSource(job_id=job_id, source_type="greenhouse", source_url=absolute_url))
    elif row.job_id != job_id:
        row.job_id = job_id
        row.discovered_at = now


def _upsert_job(db: Session, payload: JobIngestPayload) -> tuple[Job, bool]:
    """Upsert by absolute_url, then secondary dedupe key. Returns (job, created?)."""
    company = _get_or_create_company(db, payload.company_name)
    board = _get_or_create_board(db, payload)

    content_text = html_to_text(payload.content_html)
    title_norm = payload.title.strip().lower()
    location_normalized = (payload.location_raw or "").strip().lower() or None
    norm_for_hash = normalize_text_for_content_hash(content_text)
    content_hash = compute_content_hash(norm_for_hash)
    dedupe_secondary = compute_dedupe_key_secondary(company.id, title_norm, location_normalized)

    stmt = select(Job).where(Job.absolute_url == payload.absolute_url)
    job = db.execute(stmt).scalar_one_or_none()
    if job is None:
        stmt = select(Job).where(Job.dedupe_key_secondary == dedupe_secondary)
        job = db.execute(stmt).scalar_one_or_none()

    filters = apply_filters(payload.title, payload.location_raw, payload.country, payload.is_remote, content_text)
    score_res = compute_score(payload.title, payload.location_raw, content_text)

    flags = {}
    if len(content_text) < 100:
        flags["short_description"] = True

    now = dt.datetime.now(dt.timezone.utc)
    
    # Ghost Job Detection Protocol
    if content_hash:
        stmt_ghost = select(Job.discovered_at).where(Job.content_hash == content_hash).order_by(Job.discovered_at.asc()).limit(1)
        oldest_occurrence = db.execute(stmt_ghost).scalar_one_or_none()
        
        if oldest_occurrence:
            delta = now - oldest_occurrence
            if delta.days > 60:
                flags["probable_ghost_job"] = True
                score_res.score = max(0, score_res.score - 30)
                score_res.reasons.append("Red flag: Ghost job warning! Matching identical text seen >60 days ago (-30)")

    created = False
    if job is None:
        job = Job(
            company_id=company.id,
            board_id=board.id,
            external_source="greenhouse",
            external_job_id=payload.external_job_id,
            title=payload.title,
            title_normalized=title_norm,
            location_raw=payload.location_raw,
            location_normalized=location_normalized,
            country=payload.country,
            is_remote=payload.is_remote,
            absolute_url=payload.absolute_url,
            application_url=payload.absolute_url,
            content_html=payload.content_html,
            content_text=content_text,
            content_hash=content_hash,
            dedupe_key_secondary=dedupe_secondary,
            updated_at_source=payload.updated_at_source,
            filter_is_uk=filters.is_uk,
            filter_is_entry_level=filters.is_entry_level,
            filter_is_ai_ml=filters.is_ai_ml,
            filter_reasons=filters.reasons,
            match_score=score_res.score,
            match_reasons=score_res.reasons,
            data_quality_flags=flags,
            last_seen_at=now,
            missed_runs=0,
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
        job.title_normalized = title_norm
        job.location_raw = payload.location_raw
        job.location_normalized = location_normalized
        job.country = payload.country
        job.is_remote = payload.is_remote
        job.absolute_url = payload.absolute_url
        job.application_url = payload.absolute_url
        job.content_html = payload.content_html
        job.content_text = content_text
        job.content_hash = content_hash
        job.dedupe_key_secondary = dedupe_secondary
        job.updated_at_source = payload.updated_at_source
        job.filter_is_uk = filters.is_uk
        job.filter_is_entry_level = filters.is_entry_level
        job.filter_is_ai_ml = filters.is_ai_ml
        job.filter_reasons = filters.reasons
        job.match_score = score_res.score
        job.match_reasons = score_res.reasons
        job.data_quality_flags = flags
        job.last_seen_at = now
        job.missed_runs = 0
        job.is_active = True

    db.flush()
    _sync_greenhouse_job_source(db, job.id, payload.absolute_url)
    return job, created


def run_greenhouse_ingest() -> Dict[str, Any]:
    """Run a single Greenhouse ingest across all configured board tokens."""
    gh_settings = get_greenhouse_settings()
    enabled = gh_settings.get("enabled", True)
    tokens: List[str] = gh_settings.get("board_tokens", [])

    if not enabled or not tokens:
        logger.info("Greenhouse ingest disabled or no board tokens configured.")
        return {"status": "skipped", "reason": "disabled_or_no_tokens"}

    run_id = str(uuid.uuid4())
    t0 = time.perf_counter()
    run_started_at = dt.datetime.now(dt.timezone.utc)
    client = GreenhouseClient()
    ingest_result: Dict[str, Any] = {}

    db = SessionLocal()
    run_log = RunLog(
        run_type="greenhouse_ingest",
        status="success",
        started_at=run_started_at,
    )
    db.add(run_log)
    db.flush()

    boards_checked = 0
    jobs_fetched = 0
    jobs_created = 0
    jobs_updated = 0
    jobs_deactivated = 0
    jobs_rejected = 0
    errors: List[str] = []
    seen_urls: Set[str] = set()
    sched = get_scheduler_settings()
    stale_threshold = int(sched.get("stale_after_missed_runs", 7))
    enable_stale = bool(sched.get("enable_stale_job_pass", True))

    try:
        logger.info(
            "ingest_start run_id=%s run_type=greenhouse_ingest boards=%d",
            run_id,
            len(tokens),
        )
        for i, token in enumerate(tokens, 1):
            try:
                locked = db.execute(text("SELECT pg_try_advisory_xact_lock(hashtext(:t))"), {"t": f"gh_{token}"}).scalar()
                if not locked:
                    logger.warning("SKIP %s: Token locked by concurrent process", token)
                    continue

                logger.info("[%d/%d] Fetching %s...", i, len(tokens), token)
                include_content_raw = os.getenv("GREENHOUSE_INCLUDE_CONTENT", "true").strip().lower()
                include_content = include_content_raw not in ("0", "false", "no", "off")
                data = client.get_jobs(token, include_content=include_content)
                raw_jobs = data.get("jobs", [])
                
                stmt_b = select(Board).where(Board.token == token, Board.source_type == "greenhouse")
                board = db.execute(stmt_b).scalar_one_or_none()
                if not board:
                    board = Board(
                        source_type="greenhouse", 
                        token=token, 
                        board_url=f"https://boards.greenhouse.io/{token}", 
                        api_url=f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs", 
                        is_active=True
                    )
                    db.add(board)
                    db.flush()
                
                fetched = len(raw_jobs)
                if board.last_job_count > 10 and fetched < (board.last_job_count * 0.5):
                    err_msg = f"CRITICAL ANOMALY: {token} volume dropped >50% (from {board.last_job_count} to {fetched})"
                    logger.error(err_msg)
                    errors.append(err_msg)
                
                board.last_job_count = fetched
                board.last_checked_at = dt.datetime.now(dt.timezone.utc)
                board.last_success_at = dt.datetime.now(dt.timezone.utc)
                
                boards_checked += 1
                jobs_fetched += len(raw_jobs)

                for raw in raw_jobs:
                    try:
                        payload = parse_job(raw, token)
                        if not payload.title or not payload.absolute_url:
                            logger.warning("Rejecting job id=%s token=%s: Missing title or absolute_url", raw.get("id"), token)
                            jobs_rejected += 1
                            continue
                            
                        seen_urls.add(payload.absolute_url)
                        _, created = _upsert_job(db, payload)
                        if created:
                            jobs_created += 1
                            
                            # Real-time Webhook Engine Notification Hook
                            from pipeline.webhooks import trigger_job_webhooks
                            import asyncio
                            
                            stmt = select(Job).where(Job.absolute_url == payload.absolute_url)
                            new_job = db.execute(stmt).scalar_one_or_none()
                            if new_job:
                                trigger_job_webhooks(db, new_job)
                        else:
                            jobs_updated += 1
                    except Exception as job_exc:  # noqa: BLE001
                        msg = f"job_error token={token} id={raw.get('id')}: {job_exc}"
                        logger.exception(msg)
                        errors.append(msg)
                db.commit()
                logger.info("  -> %d jobs (total created=%d, updated=%d)", len(raw_jobs), jobs_created, jobs_updated)
            except GreenhouseBoardNotFoundError as err:
                msg = f"board_not_found token={token}: {err}"
                logger.warning("  -> DISABLE BOARD %s: %s", token, err)
                errors.append(msg)
                db.rollback()
                
                stmt = select(Board).where(Board.token == token, Board.source_type == "greenhouse")
                board = db.execute(stmt).scalar_one_or_none()
                if board:
                    board.is_active = False
                else:
                    board = Board(source_type="greenhouse", token=token, board_url=f"https://boards.greenhouse.io/{token}", api_url=f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs", is_active=False)
                    db.add(board)
                db.commit()
            except GreenhouseClientError as client_exc:
                msg = f"board_error token={token}: {client_exc}"
                logger.warning("  -> SKIP %s: %s", token, client_exc)
                errors.append(msg)
                db.rollback()

        if boards_checked > 0 and enable_stale and stale_threshold > 0:
            jobs_deactivated = apply_stale_after_ingest(
                db,
                seen_urls,
                stale_threshold=stale_threshold,
                run_started_at=run_started_at,
            )
            db.commit()
            logger.info("stale_pass deactivated=%d seen_urls=%d", jobs_deactivated, len(seen_urls))

    except Exception as exc:  # noqa: BLE001
        logger.exception("Greenhouse ingest failed with unexpected error: %s", exc)
        run_log.status = "failed"
    else:
        if errors:
            run_log.status = "partial"
        else:
            run_log.status = "success"
    finally:
        ended = dt.datetime.now(dt.timezone.utc)
        run_log.ended_at = ended
        run_log.boards_checked = boards_checked
        run_log.jobs_fetched = jobs_fetched
        run_log.jobs_created = jobs_created
        run_log.jobs_updated = jobs_updated
        run_log.jobs_deactivated = jobs_deactivated
        run_log.jobs_rejected = jobs_rejected
        run_log.errors_count = len(errors)
        run_log.errors_sample = errors[:5]
        db.commit()
        try:
            maybe_alert_on_run(run_log)
        except Exception as alert_exc:  # noqa: BLE001
            logger.warning("Alert hook failed: %s", alert_exc)
        db.close()
        duration_ms = int((time.perf_counter() - t0) * 1000)
        logger.info(
            "ingest_end run_id=%s status=%s duration_ms=%s boards_checked=%s errors=%s",
            run_id,
            run_log.status,
            duration_ms,
            boards_checked,
            len(errors),
        )
        ingest_result = {
            "status": run_log.status,
            "boards_checked": boards_checked,
            "jobs_fetched": jobs_fetched,
            "jobs_created": jobs_created,
            "jobs_updated": jobs_updated,
            "jobs_deactivated": jobs_deactivated,
            "jobs_rejected": jobs_rejected,
            "errors_count": len(errors),
            "run_id": run_id,
        }

    return ingest_result


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

