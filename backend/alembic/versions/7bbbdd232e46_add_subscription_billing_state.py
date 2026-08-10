"""add subscription billing state

Revision ID: 7bbbdd232e46
Revises: 4b07c8c09988
Create Date: 2026-08-09 21:04:49.983907

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7bbbdd232e46'
down_revision: Union[str, Sequence[str], None] = '4b07c8c09988'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "user_subscriptions",
        sa.Column(
            "billing_status",
            sa.String(length=30),
            nullable=False,
            server_default="current",
        ),
    )
    op.add_column(
        "user_subscriptions",
        sa.Column(
            "last_invoice_id",
            sa.String(length=255),
            nullable=True,
        ),
    )
    op.add_column(
        "user_subscriptions",
        sa.Column(
            "last_payment_failed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_user_subscriptions_billing_status",
        "user_subscriptions",
        ["billing_status"],
        unique=False,
    )
    op.create_index(
        "ix_user_subscriptions_last_invoice_id",
        "user_subscriptions",
        ["last_invoice_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_subscriptions_last_payment_failed_at",
        "user_subscriptions",
        ["last_payment_failed_at"],
        unique=False,
    )

    op.alter_column(
        "user_subscriptions",
        "billing_status",
        server_default=None,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        "ix_user_subscriptions_last_payment_failed_at",
        table_name="user_subscriptions",
    )
    op.drop_index(
        "ix_user_subscriptions_last_invoice_id",
        table_name="user_subscriptions",
    )
    op.drop_index(
        "ix_user_subscriptions_billing_status",
        table_name="user_subscriptions",
    )

    op.drop_column(
        "user_subscriptions",
        "last_payment_failed_at",
    )
    op.drop_column(
        "user_subscriptions",
        "last_invoice_id",
    )
    op.drop_column(
        "user_subscriptions",
        "billing_status",
    )
