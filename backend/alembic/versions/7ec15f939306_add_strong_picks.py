"""add strong picks

Revision ID: 7ec15f939306
Revises: e48e172e6b60
Create Date: 2026-08-26 00:42:16.026212
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7ec15f939306"
down_revision: Union[str, Sequence[str], None] = "e48e172e6b60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "strong_picks",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
            nullable=False,
        ),
        sa.Column(
            "match_id",
            sa.Integer(),
            sa.ForeignKey(
                "matches.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "prediction_record_id",
            sa.Integer(),
            sa.ForeignKey(
                "prediction_records.id",
                ondelete="CASCADE",
            ),
            nullable=False,
        ),
        sa.Column(
            "market",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "selection",
            sa.String(length=200),
            nullable=False,
        ),
        sa.Column(
            "probability",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "confidence",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "strength_score",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "actual_result",
            sa.String(length=100),
            nullable=True,
        ),
        sa.Column(
            "actual_value",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "is_winner",
            sa.Boolean(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "evaluated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.UniqueConstraint(
            "match_id",
            name="uq_strong_picks_match_id",
        ),
    )

    op.create_index(
        "ix_strong_picks_match_id",
        "strong_picks",
        ["match_id"],
        unique=True,
    )

    op.create_index(
        "ix_strong_picks_prediction_record_id",
        "strong_picks",
        ["prediction_record_id"],
        unique=False,
    )

    op.create_index(
        "ix_strong_picks_status",
        "strong_picks",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_strong_picks_status",
        table_name="strong_picks",
    )
    op.drop_index(
        "ix_strong_picks_prediction_record_id",
        table_name="strong_picks",
    )
    op.drop_index(
        "ix_strong_picks_match_id",
        table_name="strong_picks",
    )
    op.drop_table("strong_picks")
