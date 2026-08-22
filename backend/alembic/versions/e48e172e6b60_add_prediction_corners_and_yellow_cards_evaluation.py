"""add prediction corners and yellow cards evaluation

Revision ID: e48e172e6b60
Revises: d8f1a6c3e920
Create Date: 2026-08-22
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e48e172e6b60"
down_revision: Union[str, Sequence[str], None] = "d8f1a6c3e920"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "prediction_records",
        sa.Column("expected_home_corners", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("expected_away_corners", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("expected_total_corners", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("expected_corners_min", sa.Integer(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("expected_corners_max", sa.Integer(), nullable=True),
    )

    op.add_column(
        "prediction_records",
        sa.Column("expected_home_yellow_cards", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("expected_away_yellow_cards", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("expected_total_yellow_cards", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("expected_yellow_cards_min", sa.Integer(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("expected_yellow_cards_max", sa.Integer(), nullable=True),
    )

    op.add_column(
        "prediction_records",
        sa.Column("actual_home_corners", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("actual_away_corners", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("actual_total_corners", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("corners_correct", sa.Boolean(), nullable=True),
    )

    op.add_column(
        "prediction_records",
        sa.Column("actual_home_yellow_cards", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("actual_away_yellow_cards", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("actual_total_yellow_cards", sa.Float(), nullable=True),
    )
    op.add_column(
        "prediction_records",
        sa.Column("yellow_cards_correct", sa.Boolean(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("prediction_records", "yellow_cards_correct")
    op.drop_column("prediction_records", "actual_total_yellow_cards")
    op.drop_column("prediction_records", "actual_away_yellow_cards")
    op.drop_column("prediction_records", "actual_home_yellow_cards")

    op.drop_column("prediction_records", "corners_correct")
    op.drop_column("prediction_records", "actual_total_corners")
    op.drop_column("prediction_records", "actual_away_corners")
    op.drop_column("prediction_records", "actual_home_corners")

    op.drop_column("prediction_records", "expected_yellow_cards_max")
    op.drop_column("prediction_records", "expected_yellow_cards_min")
    op.drop_column("prediction_records", "expected_total_yellow_cards")
    op.drop_column("prediction_records", "expected_away_yellow_cards")
    op.drop_column("prediction_records", "expected_home_yellow_cards")

    op.drop_column("prediction_records", "expected_corners_max")
    op.drop_column("prediction_records", "expected_corners_min")
    op.drop_column("prediction_records", "expected_total_corners")
    op.drop_column("prediction_records", "expected_away_corners")
    op.drop_column("prediction_records", "expected_home_corners")
