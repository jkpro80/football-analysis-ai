"""add prediction card share links

Revision ID: c91e4a7b2f60
Revises: 7b8f1c2d3e4f
Create Date: 2026-09-07 19:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c91e4a7b2f60"
down_revision: Union[str, Sequence[str], None] = "7b8f1c2d3e4f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "prediction_card_share_links",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("match_id", sa.Integer(), nullable=False),
        sa.Column("prediction_record_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("owner_browser_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "verified_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
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
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "token_hash",
            name="uq_prediction_card_share_links_token_hash",
        ),
    )

    op.create_index(
        op.f("ix_prediction_card_share_links_id"),
        "prediction_card_share_links",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_prediction_card_share_links_user_id"),
        "prediction_card_share_links",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_prediction_card_share_links_match_id"),
        "prediction_card_share_links",
        ["match_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_prediction_card_share_links_prediction_record_id"),
        "prediction_card_share_links",
        ["prediction_record_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_prediction_card_share_links_token_hash"),
        "prediction_card_share_links",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        op.f("ix_prediction_card_share_links_owner_browser_hash"),
        "prediction_card_share_links",
        ["owner_browser_hash"],
        unique=False,
    )
    op.create_index(
        op.f("ix_prediction_card_share_links_verified_at"),
        "prediction_card_share_links",
        ["verified_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_prediction_card_share_links_created_at"),
        "prediction_card_share_links",
        ["created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_prediction_card_share_links_created_at"),
        table_name="prediction_card_share_links",
    )
    op.drop_index(
        op.f("ix_prediction_card_share_links_verified_at"),
        table_name="prediction_card_share_links",
    )
    op.drop_index(
        op.f("ix_prediction_card_share_links_owner_browser_hash"),
        table_name="prediction_card_share_links",
    )
    op.drop_index(
        op.f("ix_prediction_card_share_links_token_hash"),
        table_name="prediction_card_share_links",
    )
    op.drop_index(
        op.f("ix_prediction_card_share_links_prediction_record_id"),
        table_name="prediction_card_share_links",
    )
    op.drop_index(
        op.f("ix_prediction_card_share_links_match_id"),
        table_name="prediction_card_share_links",
    )
    op.drop_index(
        op.f("ix_prediction_card_share_links_user_id"),
        table_name="prediction_card_share_links",
    )
    op.drop_index(
        op.f("ix_prediction_card_share_links_id"),
        table_name="prediction_card_share_links",
    )
    op.drop_table("prediction_card_share_links")
