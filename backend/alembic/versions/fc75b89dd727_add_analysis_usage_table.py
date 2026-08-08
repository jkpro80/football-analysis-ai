"""add_analysis_usage_table
Revision ID: fc75b89dd727
Revises: 8f3c1a2b7d90
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
revision: str = "fc75b89dd727"
down_revision: Union[str, Sequence[str], None] = "8f3c1a2b7d90"
branch_labels = None
depends_on = None
def upgrade() -> None:
    op.create_table(
        "analysis_usage",
        sa.Column(
            "id",
            sa.Integer(),
            primary_key=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey(
                "users.id",
                ondelete="CASCADE",
            ),
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
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_analysis_usage_user_id",
        "analysis_usage",
        ["user_id"],
    )
    op.create_index(
        "ix_analysis_usage_match_id",
        "analysis_usage",
        ["match_id"],
    )
    op.create_index(
        "ix_analysis_usage_created_at",
        "analysis_usage",
        ["created_at"],
    )
def downgrade() -> None:
    op.drop_index(
        "ix_analysis_usage_created_at",
        table_name="analysis_usage",
    )
    op.drop_index(
        "ix_analysis_usage_match_id",
        table_name="analysis_usage",
    )
    op.drop_index(
        "ix_analysis_usage_user_id",
        table_name="analysis_usage",
    )
    op.drop_table("analysis_usage")
