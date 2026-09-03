"""add prediction cards

Revision ID: 515ec1eaf3b8
Revises: 7ec15f939306
Create Date: 2026-08-27
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "515ec1eaf3b8"
down_revision: Union[str, Sequence[str], None] = "7ec15f939306"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "prediction_cards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("card_number", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("card_number"),
    )

    op.create_index(
        "ix_prediction_cards_id",
        "prediction_cards",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_prediction_cards_user_id",
        "prediction_cards",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_prediction_cards_card_number",
        "prediction_cards",
        ["card_number"],
        unique=True,
    )
    op.create_index(
        "ix_prediction_cards_status",
        "prediction_cards",
        ["status"],
        unique=False,
    )

    op.create_table(
        "prediction_card_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("card_id", sa.Integer(), nullable=False),
        sa.Column("match_id", sa.Integer(), nullable=False),
        sa.Column(
            "prediction_record_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column("market", sa.String(length=50), nullable=False),
        sa.Column("selection", sa.String(length=100), nullable=False),
        sa.Column("line", sa.Float(), nullable=True),
        sa.Column("expected_value", sa.Float(), nullable=True),
        sa.Column("probability", sa.Float(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("model_version", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["card_id"],
            ["prediction_cards.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["match_id"],
            ["matches.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["prediction_record_id"],
            ["prediction_records.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "card_id",
            "match_id",
            "market",
            "selection",
            "line",
            name="uq_prediction_card_item_selection",
        ),
    )

    op.create_index(
        "ix_prediction_card_items_id",
        "prediction_card_items",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_prediction_card_items_card_id",
        "prediction_card_items",
        ["card_id"],
        unique=False,
    )
    op.create_index(
        "ix_prediction_card_items_match_id",
        "prediction_card_items",
        ["match_id"],
        unique=False,
    )
    op.create_index(
        "ix_prediction_card_items_prediction_record_id",
        "prediction_card_items",
        ["prediction_record_id"],
        unique=False,
    )
    op.create_index(
        "ix_prediction_card_items_market",
        "prediction_card_items",
        ["market"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_prediction_card_items_market",
        table_name="prediction_card_items",
    )
    op.drop_index(
        "ix_prediction_card_items_prediction_record_id",
        table_name="prediction_card_items",
    )
    op.drop_index(
        "ix_prediction_card_items_match_id",
        table_name="prediction_card_items",
    )
    op.drop_index(
        "ix_prediction_card_items_card_id",
        table_name="prediction_card_items",
    )
    op.drop_index(
        "ix_prediction_card_items_id",
        table_name="prediction_card_items",
    )

    op.drop_table("prediction_card_items")

    op.drop_index(
        "ix_prediction_cards_status",
        table_name="prediction_cards",
    )
    op.drop_index(
        "ix_prediction_cards_card_number",
        table_name="prediction_cards",
    )
    op.drop_index(
        "ix_prediction_cards_user_id",
        table_name="prediction_cards",
    )
    op.drop_index(
        "ix_prediction_cards_id",
        table_name="prediction_cards",
    )

    op.drop_table("prediction_cards")
