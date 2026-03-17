from __future__ import annotations

import uuid
import datetime as dt
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base


class TimestampMixin:
    created_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    name_normalized: Mapped[str] = mapped_column(Text, nullable=False, unique=True, index=True)
    domain: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    jobs: Mapped[list["Job"]] = relationship(back_populates="company")


class Board(Base, TimestampMixin):
    __tablename__ = "boards"

    __table_args__ = (UniqueConstraint("source_type", "token", name="uq_boards_source_type_token"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type: Mapped[str] = mapped_column(Text, nullable=False, default="greenhouse")
    token: Mapped[str] = mapped_column(Text, nullable=False)
    board_url: Mapped[str] = mapped_column(Text, nullable=False)
    api_url: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    last_checked_at: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    last_success_at: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    last_job_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    jobs: Mapped[list["Job"]] = relationship(back_populates="board")


class Job(Base, TimestampMixin):
    __tablename__ = "jobs"

    __table_args__ = (UniqueConstraint("absolute_url", name="uq_jobs_absolute_url"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True
    )
    board_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("boards.id"), nullable=True, index=True
    )

    external_source: Mapped[str] = mapped_column(Text, nullable=False, default="greenhouse")
    external_job_id: Mapped[str] = mapped_column(Text, nullable=False)

    title: Mapped[str] = mapped_column(Text, nullable=False)
    title_normalized: Mapped[str] = mapped_column(Text, nullable=False, index=True)

    location_raw: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location_normalized: Mapped[Optional[str]] = mapped_column(Text, nullable=True, index=True)
    country: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_remote: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    employment_type: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    absolute_url: Mapped[str] = mapped_column(Text, nullable=False)
    application_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    content_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_hash: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    posted_at: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    updated_at_source: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    discovered_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    last_seen_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    filter_is_uk: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    filter_is_entry_level: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    filter_is_ai_ml: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    filter_reasons: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)

    match_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    match_reasons: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)

    company: Mapped["Company"] = relationship(back_populates="jobs")
    board: Mapped[Optional["Board"]] = relationship(back_populates="jobs")
    application: Mapped[Optional["Application"]] = relationship(back_populates="job")


class RunLog(Base):
    __tablename__ = "run_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_type: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False)  # success, partial, failed

    started_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    ended_at: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

    boards_checked: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    jobs_fetched: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    jobs_created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    jobs_updated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    jobs_deactivated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    errors_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    errors_sample: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)

    created_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )


class Application(Base, TimestampMixin):
    __tablename__ = "applications"

    __table_args__ = (UniqueConstraint("job_id", name="uq_applications_job_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(length=32), nullable=False, default="saved", index=True
    )

    applied_at: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    last_follow_up_at: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    next_follow_up_at: Mapped[Optional[dt.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, index=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    custom_fields: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    job: Mapped["Job"] = relationship(back_populates="application")

