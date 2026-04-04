"""Secondary dedupe key + job_sources table.

Revision ID: 0003_dedupe_job_sources
Revises: 0002_job_missed_runs
Create Date: 2026-03-30
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0003_dedupe_job_sources"
down_revision = "0002_job_missed_runs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("jobs", sa.Column("dedupe_key_secondary", sa.Text(), nullable=True))
    op.create_index("ix_jobs_dedupe_key_secondary", "jobs", ["dedupe_key_secondary"])

    op.create_table(
        "job_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_type", sa.Text(), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=False),
        sa.Column(
            "discovered_at",
            postgresql.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "metadata",
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
        sa.UniqueConstraint("source_type", "source_url", name="uq_job_sources_source_type_url"),
    )
    op.create_index("ix_job_sources_job_id", "job_sources", ["job_id"])


def downgrade() -> None:
    op.drop_index("ix_job_sources_job_id", table_name="job_sources")
    op.drop_table("job_sources")
    op.drop_index("ix_jobs_dedupe_key_secondary", table_name="jobs")
    op.drop_column("jobs", "dedupe_key_secondary")
