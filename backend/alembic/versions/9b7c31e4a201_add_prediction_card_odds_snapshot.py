# Add prediction card odds snapshot
# Revision ID: 9b7c31e4a201
# Revises: 46515265f160

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9b7c31e4a201"
down_revision: Union[str, Sequence[str], None] = "46515265f160"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("prediction_card_items", sa.Column("decimal_odds", sa.Float(), nullable=True))
    op.add_column("prediction_card_items", sa.Column("bookmaker_name", sa.String(length=255), nullable=True))
    op.add_column("prediction_card_items", sa.Column("provider_odd_id", sa.BigInteger(), nullable=True))


def downgrade() -> None:
    op.drop_column("prediction_card_items", "provider_odd_id")
    op.drop_column("prediction_card_items", "bookmaker_name")
    op.drop_column("prediction_card_items", "decimal_odds")
