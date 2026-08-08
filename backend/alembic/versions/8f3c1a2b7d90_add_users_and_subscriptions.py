"""add users and subscriptions
Revision ID: 8f3c1a2b7d90
Revises: 522e0ae6a39a
Create Date: 2026-08-06
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
revision: str = "8f3c1a2b7d90"
down_revision: Union[str, Sequence[str], None] = "522e0ae6a39a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None
def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.String(length=30),
            nullable=False,
            server_default="user",
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index(
        "ix_users_id",
        "users",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
    )
    op.create_index(
        "ix_users_username",
        "users",
        ["username"],
        unique=True,
    )
    op.create_table(
        "subscription_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column(
            "monthly_price",
            sa.Float(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "currency",
            sa.String(length=10),
            nullable=False,
            server_default="USD",
        ),
        sa.Column("analysis_limit", sa.Integer(), nullable=True),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index(
        "ix_subscription_plans_id",
        "subscription_plans",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_subscription_plans_code",
        "subscription_plans",
        ["code"],
        unique=True,
    )
    op.create_table(
        "user_subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("plan_id", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.String(length=30),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "starts_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "auto_renew",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(
            ["plan_id"],
            ["subscription_plans.id"],
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_user_subscriptions_id",
        "user_subscriptions",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_user_subscriptions_user_id",
        "user_subscriptions",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_subscriptions_plan_id",
        "user_subscriptions",
        ["plan_id"],
        unique=False,
    )
    op.create_index(
        "ix_user_subscriptions_status",
        "user_subscriptions",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_user_subscriptions_ends_at",
        "user_subscriptions",
        ["ends_at"],
        unique=False,
    )
    subscription_plans = sa.table(
        "subscription_plans",
        sa.column("code", sa.String()),
        sa.column("name", sa.String()),
        sa.column("description", sa.String()),
        sa.column("monthly_price", sa.Float()),
        sa.column("currency", sa.String()),
        sa.column("analysis_limit", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
    )
    op.bulk_insert(
        subscription_plans,
        [
            {
                "code": "free",
                "name": "Free",
                "description": "Basic football analysis access.",
                "monthly_price": 0.0,
                "currency": "USD",
                "analysis_limit": 10,
                "is_active": True,
            },
            {
                "code": "pro",
                "name": "Pro",
                "description": "Full predictions and advanced analysis.",
                "monthly_price": 9.99,
                "currency": "USD",
                "analysis_limit": None,
                "is_active": True,
            },
            {
                "code": "premium",
                "name": "Premium",
                "description": "Advanced access for professional users.",
                "monthly_price": 19.99,
                "currency": "USD",
                "analysis_limit": None,
                "is_active": True,
            },
        ],
    )
def downgrade() -> None:
    op.drop_index(
        "ix_user_subscriptions_ends_at",
        table_name="user_subscriptions",
    )
    op.drop_index(
        "ix_user_subscriptions_status",
        table_name="user_subscriptions",
    )
    op.drop_index(
        "ix_user_subscriptions_plan_id",
        table_name="user_subscriptions",
    )
    op.drop_index(
        "ix_user_subscriptions_user_id",
        table_name="user_subscriptions",
    )
    op.drop_index(
        "ix_user_subscriptions_id",
        table_name="user_subscriptions",
    )
    op.drop_table("user_subscriptions")
    op.drop_index(
        "ix_subscription_plans_code",
        table_name="subscription_plans",
    )
    op.drop_index(
        "ix_subscription_plans_id",
        table_name="subscription_plans",
    )
    op.drop_table("subscription_plans")
    op.drop_index(
        "ix_users_username",
        table_name="users",
    )
    op.drop_index(
        "ix_users_email",
        table_name="users",
    )
    op.drop_index(
        "ix_users_id",
        table_name="users",
    )
    op.drop_table("users")
