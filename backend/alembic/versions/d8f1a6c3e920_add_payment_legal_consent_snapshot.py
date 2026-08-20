"""add payment legal consent snapshot

Revision ID: d8f1a6c3e920
Revises: c4a7e9d2f1b6
Create Date: 2026-08-21

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d8f1a6c3e920"
down_revision: Union[str, Sequence[str], None] = "c4a7e9d2f1b6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "payments",
        sa.Column(
            "subscription_terms_accepted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "payments",
        sa.Column(
            "subscription_terms_version",
            sa.String(length=50),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "payments",
        "subscription_terms_version",
    )

    op.drop_column(
        "payments",
        "subscription_terms_accepted_at",
    )
