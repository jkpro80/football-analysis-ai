"""add prediction card ou market fields

Revision ID: f17af6b6c03f
Revises: c91e4a7b2f60
Create Date: 2026-09-07
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f17af6b6c03f"
down_revision: Union[str, Sequence[str], None] = "c91e4a7b2f60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "prediction_records",
        sa.Column("corners_market_line", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("corners_market_pick", sa.String(length=10), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("corners_market_probability", sa.Float(), nullable=True),
    )

    op.add_column(
        "prediction_records",
        sa.Column("yellow_cards_market_line", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("yellow_cards_market_pick", sa.String(length=10), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("yellow_cards_market_probability", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("prediction_records", "yellow_cards_market_probability")
    op.drop_column("prediction_records", "yellow_cards_market_pick")
    op.drop_column("prediction_records", "yellow_cards_market_line")

    op.drop_column("prediction_records", "corners_market_probability")
    op.drop_column("prediction_records", "corners_market_pick")
    op.drop_column("prediction_records", "corners_market_line")
