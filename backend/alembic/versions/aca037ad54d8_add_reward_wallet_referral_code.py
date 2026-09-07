"""add reward wallet referral code

Revision ID: aca037ad54d8
Revises: 55680ae18f10
Create Date: 2026-09-04 16:41:45.526073
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "aca037ad54d8"
down_revision: Union[str, Sequence[str], None] = "55680ae18f10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "reward_wallets",
        sa.Column(
            "referral_code",
            sa.String(length=16),
            nullable=True,
        ),
    )
    op.create_index(
        op.f("ix_reward_wallets_referral_code"),
        "reward_wallets",
        ["referral_code"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_reward_wallets_referral_code"),
        table_name="reward_wallets",
    )
    op.drop_column(
        "reward_wallets",
        "referral_code",
    )
