from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import (
    SubscriptionPlan,
    User,
    UserSubscription,
)
from app.security import verify_admin_api_key


router = APIRouter(
    prefix="/admin/statistics",
    tags=["Admin Statistics"],
    dependencies=[Depends(verify_admin_api_key)],
)


@router.get("")
def get_admin_statistics(
    db: Session = Depends(get_db),
) -> dict[str, int]:
    now = datetime.now(timezone.utc)

    total_users = db.query(User).count()

    active_users = (
        db.query(User)
        .filter(User.is_active.is_(True))
        .count()
    )

    active_subscriptions = (
        db.query(
            UserSubscription.user_id,
            SubscriptionPlan.code,
        )
        .join(
            SubscriptionPlan,
            SubscriptionPlan.id == UserSubscription.plan_id,
        )
        .filter(
            UserSubscription.status == "active",
            UserSubscription.starts_at <= now,
            (
                UserSubscription.ends_at.is_(None)
                | (UserSubscription.ends_at > now)
            ),
        )
        .order_by(
            UserSubscription.user_id,
            UserSubscription.starts_at.desc(),
            UserSubscription.id.desc(),
        )
        .all()
    )

    # Defensive de-duplication:
    # only the newest currently-active subscription counts per user.
    current_plan_by_user: dict[int, str] = {}

    for user_id, plan_code in active_subscriptions:
        if user_id not in current_plan_by_user:
            current_plan_by_user[user_id] = str(
                plan_code
            ).strip().lower()

    free_users = sum(
        1
        for code in current_plan_by_user.values()
        if code == "free"
    )

    pro_users = sum(
        1
        for code in current_plan_by_user.values()
        if code == "pro"
    )

    premium_users = sum(
        1
        for code in current_plan_by_user.values()
        if code == "premium"
    )

    paid_active = sum(
        1
        for code in current_plan_by_user.values()
        if code in {"pro", "premium"}
    )

    return {
        "total_users": total_users,
        "active_users": active_users,
        "free": free_users,
        "pro": pro_users,
        "premium": premium_users,
        "paid_active": paid_active,
    }
