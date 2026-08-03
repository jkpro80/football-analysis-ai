"""clean team null statistics"""

from typing import Sequence, Union

from alembic import op


revision = "7ac4915725cb"
down_revision = "e17b41e89ee0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        UPDATE teams
        SET wins = 0
        WHERE wins IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET draws = 0
        WHERE draws IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET losses = 0
        WHERE losses IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET form = 'DDDDD'
        WHERE form IS NULL OR form = ''
        """
    )

    op.execute(
        """
        UPDATE teams
        SET goals_scored = 1.5
        WHERE goals_scored IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET goals_conceded = 1.0
        WHERE goals_conceded IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET possession = 50.0
        WHERE possession IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET shots = 12.0
        WHERE shots IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET shots_on_target = 5.0
        WHERE shots_on_target IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET corners = 5.0
        WHERE corners IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET yellow_cards = 2.0
        WHERE yellow_cards IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET red_cards = 0.1
        WHERE red_cards IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET clean_sheets = 0.0
        WHERE clean_sheets IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET failed_to_score = 0.0
        WHERE failed_to_score IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET xg = 1.5
        WHERE xg IS NULL
        """
    )

    op.execute(
        """
        UPDATE teams
        SET xga = 1.0
        WHERE xga IS NULL
        """
    )


def downgrade() -> None:
    pass