"""Create initial MVP tables.

Revision ID: 0001_initial
Revises: 
Create Date: 2026-03-17
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("name_normalized", sa.Text(), nullable=False),
        sa.Column("domain", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("name_normalized", name="uq_companies_name_normalized"),
    )
    op.create_index("ix_companies_name_normalized", "companies", ["name_normalized"])

    op.create_table(
        "boards",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("source_type", sa.Text(), nullable=False),
        sa.Column("token", sa.Text(), nullable=False),
        sa.Column("board_url", sa.Text(), nullable=False),
        sa.Column("api_url", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_checked_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("last_success_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("last_job_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("source_type", "token", name="uq_boards_source_type_token"),
    )
    op.create_index("ix_boards_is_active", "boards", ["is_active"])

    op.create_table(
        "jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("board_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("boards.id"), nullable=True),
        sa.Column("external_source", sa.Text(), nullable=False, server_default=sa.text("'greenhouse'")),
        sa.Column("external_job_id", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("title_normalized", sa.Text(), nullable=False),
        sa.Column("location_raw", sa.Text(), nullable=True),
        sa.Column("location_normalized", sa.Text(), nullable=True),
        sa.Column("country", sa.Text(), nullable=True),
        sa.Column("is_remote", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("employment_type", sa.Text(), nullable=True),
        sa.Column("absolute_url", sa.Text(), nullable=False),
        sa.Column("application_url", sa.Text(), nullable=True),
        sa.Column("content_html", sa.Text(), nullable=True),
        sa.Column("content_text", sa.Text(), nullable=True),
        sa.Column("content_hash", sa.Text(), nullable=True),
        sa.Column("posted_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("updated_at_source", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "discovered_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "last_seen_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("filter_is_uk", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("filter_is_entry_level", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("filter_is_ai_ml", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "filter_reasons",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column("match_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "match_reasons",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("absolute_url", name="uq_jobs_absolute_url"),
    )
    op.create_index("ix_jobs_company_id", "jobs", ["company_id"])
    op.create_index("ix_jobs_board_id", "jobs", ["board_id"])
    op.create_index("ix_jobs_title_normalized", "jobs", ["title_normalized"])
    op.create_index("ix_jobs_location_normalized", "jobs", ["location_normalized"])
    op.create_index(
        "ix_jobs_filter_flags",
        "jobs",
        ["filter_is_uk", "filter_is_entry_level", "filter_is_ai_ml"],
    )
    op.create_index("ix_jobs_match_score", "jobs", ["match_score"])
    op.create_index("ix_jobs_last_seen_at", "jobs", ["last_seen_at"])
    op.create_index("ix_jobs_is_active", "jobs", ["is_active"])

    op.create_table(
        "run_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("run_type", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column(
            "started_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("ended_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("boards_checked", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("jobs_fetched", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("jobs_created", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("jobs_updated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("jobs_deactivated", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("errors_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "errors_sample",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'[]'::jsonb"),
        ),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )
    op.create_index("ix_run_logs_run_type_started_at", "run_logs", ["run_type", "started_at"])

    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id"), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default=sa.text("'saved'")),
        sa.Column("applied_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("last_follow_up_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("next_follow_up_at", postgresql.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "custom_fields",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column(
            "created_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("job_id", name="uq_applications_job_id"),
    )
    op.create_index("ix_applications_job_id", "applications", ["job_id"])
    op.create_index("ix_applications_status", "applications", ["status"])
    op.create_index("ix_applications_next_follow_up_at", "applications", ["next_follow_up_at"])


def downgrade() -> None:
    op.drop_index("ix_applications_next_follow_up_at", table_name="applications")
    op.drop_index("ix_applications_status", table_name="applications")
    op.drop_index("ix_applications_job_id", table_name="applications")
    op.drop_table("applications")

    op.drop_index("ix_run_logs_run_type_started_at", table_name="run_logs")
    op.drop_table("run_logs")

    op.drop_index("ix_jobs_is_active", table_name="jobs")
    op.drop_index("ix_jobs_last_seen_at", table_name="jobs")
    op.drop_index("ix_jobs_match_score", table_name="jobs")
    op.drop_index("ix_jobs_filter_flags", table_name="jobs")
    op.drop_index("ix_jobs_location_normalized", table_name="jobs")
    op.drop_index("ix_jobs_title_normalized", table_name="jobs")
    op.drop_index("ix_jobs_board_id", table_name="jobs")
    op.drop_index("ix_jobs_company_id", table_name="jobs")
    op.drop_table("jobs")

    op.drop_index("ix_boards_is_active", table_name="boards")
    op.drop_table("boards")

    op.drop_index("ix_companies_name_normalized", table_name="companies")
    op.drop_table("companies")

