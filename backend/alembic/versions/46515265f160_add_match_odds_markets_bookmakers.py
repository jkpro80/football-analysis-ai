"""add match odds markets bookmakers

Revision ID: 46515265f160
Revises: 834550662e57
Create Date: 2026-08-31 05:21:55.135424

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46515265f160'
down_revision: Union[str, Sequence[str], None] = '834550662e57'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "match_odds",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("match_id", sa.Integer(), nullable=False),
        sa.Column("provider_fixture_id", sa.Integer(), nullable=False),
        sa.Column("provider_odd_id", sa.BigInteger(), nullable=False),
        sa.Column("market_id", sa.Integer(), nullable=False),
        sa.Column("market_name", sa.String(length=255), nullable=True),
        sa.Column("market_developer_name", sa.String(length=255), nullable=True),
        sa.Column("market_description", sa.String(length=255), nullable=True),
        sa.Column("bookmaker_id", sa.Integer(), nullable=False),
        sa.Column("bookmaker_name", sa.String(length=255), nullable=True),
        sa.Column("label", sa.String(length=255), nullable=True),
        sa.Column("selection_name", sa.String(length=255), nullable=True),
        sa.Column("original_label", sa.String(length=255), nullable=True),
        sa.Column("decimal_odds", sa.Float(), nullable=False),
        sa.Column("probability", sa.Float(), nullable=True),
        sa.Column("total", sa.String(length=50), nullable=True),
        sa.Column("handicap", sa.String(length=50), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=True),
        sa.Column("winning", sa.Boolean(), nullable=False),
        sa.Column("stopped", sa.Boolean(), nullable=False),
        sa.Column("provider_created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("latest_bookmaker_update", sa.DateTime(), nullable=True),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["match_id"], ["matches.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider_odd_id", name="uq_match_odds_provider_odd_id"),
    )
    for column in ("id", "match_id", "provider_fixture_id", "market_id", "market_developer_name", "bookmaker_id", "stopped", "latest_bookmaker_update"):
        op.create_index(f"ix_match_odds_{column}", "match_odds", [column], unique=False)


def downgrade() -> None:
    op.drop_table("match_odds")
