"""expand match statistics v6

Revision ID: c6f8a2d91b34
Revises: 09790e7e4458
Create Date: 2026-07-23
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "c6f8a2d91b34"
down_revision: Union[str, None] = "09790e7e4458"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "match_statistics",
        sa.Column(
            "assists",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "match_statistics",
        sa.Column(
            "successful_dribbles_percentage",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "match_statistics",
        sa.Column(
            "raw_statistics",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )

    op.add_column(
        "match_statistics",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("match_statistics", "updated_at")
    op.drop_column("match_statistics", "raw_statistics")
    op.drop_column(
        "match_statistics",
        "successful_dribbles_percentage",
    )
    op.drop_column("match_statistics", "assists")
