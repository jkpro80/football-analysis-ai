"""add current competition team flag

Revision ID: 834550662e57
Revises: 515ec1eaf3b8
Create Date: 2026-08-30 08:19:19.612410

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '834550662e57'
down_revision: Union[str, Sequence[str], None] = '515ec1eaf3b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add current competition membership flag to teams."""
    op.add_column(
        "teams",
        sa.Column(
            "is_current_competition_team",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )

    op.create_index(
        "ix_teams_is_current_competition_team",
        "teams",
        ["is_current_competition_team"],
        unique=False,
    )


def downgrade() -> None:
    """Remove current competition membership flag from teams."""
    op.drop_index(
        "ix_teams_is_current_competition_team",
        table_name="teams",
    )

    op.drop_column(
        "teams",
        "is_current_competition_team",
    )
