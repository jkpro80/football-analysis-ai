"""add_odds_last_attempt_at

Revision ID: 5786619320af
Revises: 9b7c31e4a201
Create Date: 2026-09-01 06:53:16.116735

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5786619320af'
down_revision: Union[str, Sequence[str], None] = '9b7c31e4a201'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("matches", sa.Column("odds_last_attempt_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("matches", "odds_last_attempt_at")
