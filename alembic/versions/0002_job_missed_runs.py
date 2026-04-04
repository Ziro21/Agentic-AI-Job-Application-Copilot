"""Add jobs.missed_runs for stale-job lifecycle.

Revision ID: 0002_job_missed_runs
Revises: 0001_initial
Create Date: 2026-03-30
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_job_missed_runs"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "jobs",
        sa.Column("missed_runs", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_index("ix_jobs_missed_runs", "jobs", ["missed_runs"])


def downgrade() -> None:
    op.drop_index("ix_jobs_missed_runs", table_name="jobs")
    op.drop_column("jobs", "missed_runs")
