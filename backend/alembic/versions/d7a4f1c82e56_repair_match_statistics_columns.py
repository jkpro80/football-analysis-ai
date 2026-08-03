"""repair missing match statistics columns

Revision ID: d7a4f1c82e56
Revises: c6f8a2d91b34
Create Date: 2026-07-23
"""

from typing import Sequence, Union

from alembic import op


revision: str = "d7a4f1c82e56"
down_revision: Union[str, None] = "c6f8a2d91b34"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE match_statistics
        ADD COLUMN IF NOT EXISTS assists DOUBLE PRECISION;
        """
    )

    op.execute(
        """
        ALTER TABLE match_statistics
        ADD COLUMN IF NOT EXISTS successful_dribbles_percentage
        DOUBLE PRECISION;
        """
    )

    op.execute(
        """
        ALTER TABLE match_statistics
        ADD COLUMN IF NOT EXISTS raw_statistics JSONB;
        """
    )

    op.execute(
        """
        ALTER TABLE match_statistics
        ADD COLUMN IF NOT EXISTS updated_at
        TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT NOW();
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE match_statistics
        DROP COLUMN IF EXISTS updated_at;
        """
    )

    op.execute(
        """
        ALTER TABLE match_statistics
        DROP COLUMN IF EXISTS raw_statistics;
        """
    )

    op.execute(
        """
        ALTER TABLE match_statistics
        DROP COLUMN IF EXISTS successful_dribbles_percentage;
        """
    )

    op.execute(
        """
        ALTER TABLE match_statistics
        DROP COLUMN IF EXISTS assists;
        """
    )
