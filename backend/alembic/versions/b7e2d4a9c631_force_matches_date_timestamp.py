"""force matches date timestamp conversion

Revision ID: b7e2d4a9c631
Revises: f4a1c9d2e7b3
Create Date: 2026-08-01
"""

from typing import Sequence, Union

from alembic import op


revision: str = "b7e2d4a9c631"
down_revision: Union[str, None] = "f4a1c9d2e7b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE matches
        ALTER COLUMN date TYPE TIMESTAMP WITHOUT TIME ZONE
        USING date::timestamp without time zone
        """
    )


def downgrade() -> None:
    op.execute(
        """
        ALTER TABLE matches
        ALTER COLUMN date TYPE VARCHAR
        USING to_char(date, 'YYYY-MM-DD HH24:MI:SS')
        """
    )
