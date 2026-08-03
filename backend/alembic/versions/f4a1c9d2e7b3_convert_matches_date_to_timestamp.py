"""convert matches date to timestamp

Revision ID: f4a1c9d2e7b3
Revises: 872c062b6914
Create Date: 2026-08-01
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f4a1c9d2e7b3"
down_revision: Union[str, None] = "872c062b6914"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "matches",
        "date",
        existing_type=sa.String(),
        type_=sa.DateTime(),
        existing_nullable=False,
        postgresql_using="date::timestamp without time zone",
    )


def downgrade() -> None:
    op.alter_column(
        "matches",
        "date",
        existing_type=sa.DateTime(),
        type_=sa.String(),
        existing_nullable=False,
        postgresql_using="to_char(date, 'YYYY-MM-DD HH24:MI:SS')",
    )
