"""add predicted score probability"""

from alembic import op
import sqlalchemy as sa

revision = "a71c9e42d8f1"
down_revision = "f17af6b6c03f"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "prediction_records",
        sa.Column("predicted_score_probability", sa.Float(), nullable=True),
    )


def downgrade():
    op.drop_column("prediction_records", "predicted_score_probability")
