from __future__ import annotations

import os
import uuid
import datetime as dt
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy_utils import StringEncryptedType
from sqlalchemy_utils.types.encrypted.encrypted_type import AesEngine

from db.base import Base

AES_SECRET_KEY = os.getenv("AES_SECRET_KEY", "0123456789abcdef0123456789abcdef")


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


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, server_default=text("false"))

    profile: Mapped["UserProfile"] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications: Mapped[list["Application"]] = relationship(back_populates="user")
    run_logs: Mapped[list["RunLog"]] = relationship(back_populates="user")


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    
    webhook_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    target_role_types: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    target_locations: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    
    user: Mapped["User"] = relationship(back_populates="profile")


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
    dedupe_key_secondary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    posted_at: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    updated_at_source: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    discovered_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    last_seen_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    missed_runs: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    filter_is_uk: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    filter_is_entry_level: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    filter_is_ai_ml: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    filter_reasons: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)

    match_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    match_reasons: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)

    data_quality_flags: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    required_yoe: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    extracted_skills: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))

    company: Mapped["Company"] = relationship(back_populates="jobs")
    board: Mapped[Optional["Board"]] = relationship(back_populates="jobs")
    application: Mapped[Optional["Application"]] = relationship(back_populates="job")
    sources: Mapped[list["JobSource"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )


class JobSource(Base):
    """Discovery URL per source type (multi-source traceability)."""

    __tablename__ = "job_sources"

    __table_args__ = (UniqueConstraint("source_type", "source_url", name="uq_job_sources_source_type_url"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_type: Mapped[str] = mapped_column(Text, nullable=False)
    source_url: Mapped[str] = mapped_column(Text, nullable=False)
    discovered_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    extra_metadata: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, default=dict)

    created_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    job: Mapped["Job"] = relationship(back_populates="sources")


class RunLog(Base):
    __tablename__ = "run_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
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
    jobs_rejected: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    errors_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    errors_sample: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)

    created_at: Mapped[dt.datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )
    
    user: Mapped[Optional["User"]] = relationship(back_populates="run_logs")


class Application(Base, TimestampMixin):
    __tablename__ = "applications"

    __table_args__ = (UniqueConstraint("job_id", "user_id", name="uq_applications_job_id_user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(
        String(length=32), nullable=False, default="saved", index=True
    )

    applied_at: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    last_follow_up_at: Mapped[Optional[dt.datetime]] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    next_follow_up_at: Mapped[Optional[dt.datetime]] = mapped_column(
        TIMESTAMP(timezone=True), nullable=True, index=True
    )
    notes: Mapped[Optional[str]] = mapped_column(
        StringEncryptedType(Text, AES_SECRET_KEY, AesEngine, 'pkcs5'), nullable=True
    )
    custom_fields: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    job: Mapped["Job"] = relationship(back_populates="application")
    user: Mapped[Optional["User"]] = relationship(back_populates="applications")

