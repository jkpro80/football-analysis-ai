"""add legal consent fields

Revision ID: c4a7e9d2f1b6
Revises: 299828945d1c
Create Date: 2026-08-20

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4a7e9d2f1b6"
down_revision: Union[str, Sequence[str], None] = "299828945d1c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "terms_accepted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "terms_version",
            sa.String(length=50),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "privacy_version",
            sa.String(length=50),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "subscription_terms_accepted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "subscription_terms_version",
            sa.String(length=50),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "users",
        "subscription_terms_version",
    )

    op.drop_column(
        "users",
        "subscription_terms_accepted_at",
    )

    op.drop_column(
        "users",
        "privacy_version",
    )

    op.drop_column(
        "users",
        "terms_version",
    )

    op.drop_column(
        "users",
        "terms_accepted_at",
    )
