from __future__ import annotations
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database.models import (
    SubscriptionPlan,
    UserSubscription,
)
class SubscriptionServiceError(Exception):
    """Base subscription service error."""
class SubscriptionPlanNotFoundError(SubscriptionServiceError):
    """Raised when a subscription plan cannot be found."""
class SubscriptionService:
    def __init__(self, db: Session) -> None:
        if db is None:
            raise ValueError("Database session is required.")
        self.db = db
    @staticmethod
    def _utc_now() -> datetime:
        return datetime.now(timezone.utc)
    def get_plan_by_code(
        self,
        plan_code: str,
        *,
        active_only: bool = True,
    ) -> SubscriptionPlan | None:
        code = self._normalize_plan_code(
            plan_code,
        )
        query = self.db.query(
            SubscriptionPlan,
        ).filter(
            SubscriptionPlan.code == code,
        )
        if active_only:
            query = query.filter(
                SubscriptionPlan.is_active.is_(True),
            )
        return query.first()
    def get_active_subscription(
        self,
        user_id: int,
    ) -> UserSubscription | None:
        user_id = self._positive_integer(
            user_id,
            field_name="user_id",
        )
        now = self._utc_now()
        return (
            self.db.query(UserSubscription)
            .filter(
                UserSubscription.user_id == user_id,
                UserSubscription.status == "active",
                (
                    UserSubscription.ends_at.is_(None)
                    | (UserSubscription.ends_at > now)
                ),
            )
            .order_by(
                UserSubscription.starts_at.desc(),
                UserSubscription.id.desc(),
            )
            .first()
        )
    def activate_plan(
        self,
        *,
        user_id: int,
        plan: SubscriptionPlan,
        auto_renew: bool = False,
    ) -> UserSubscription:
        user_id = self._positive_integer(
            user_id,
            field_name="user_id",
        )
        if plan is None:
            raise ValueError("plan is required.")
        current = self.get_active_subscription(
            user_id,
        )
        if (
            current is not None
            and current.plan_id == plan.id
        ):
            return current
        now = self._utc_now()
        try:
            active_subscriptions = (
                self.db.query(UserSubscription)
                .filter(
                    UserSubscription.user_id == user_id,
                    UserSubscription.status == "active",
                )
                .all()
            )
            for subscription in active_subscriptions:
                subscription.status = "cancelled"
                subscription.ends_at = now
                subscription.auto_renew = False
            new_subscription = UserSubscription(
                user_id=user_id,
                plan_id=plan.id,
                status="active",
                starts_at=now,
                ends_at=None,
                auto_renew=bool(auto_renew),
            )
            self.db.add(
                new_subscription,
            )
            self.db.commit()
            self.db.refresh(
                new_subscription,
            )
            return new_subscription
        except Exception:
            self.db.rollback()
            raise
    def activate_plan_by_code(
        self,
        *,
        user_id: int,
        plan_code: str,
        auto_renew: bool = False,
    ) -> UserSubscription:
        plan = self.get_plan_by_code(
            plan_code,
            active_only=True,
        )
        if plan is None:
            raise SubscriptionPlanNotFoundError(
                "Subscription plan not found.",
            )
        return self.activate_plan(
            user_id=user_id,
            plan=plan,
            auto_renew=auto_renew,
        )
    @staticmethod
    def _normalize_plan_code(
        value: str,
    ) -> str:
        if not isinstance(value, str):
            raise ValueError(
                "plan_code must be a string.",
            )
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError(
                "plan_code is required.",
            )
        if len(normalized) > 50:
            raise ValueError(
                "plan_code exceeds maximum length.",
            )
        return normalized
    @staticmethod
    def _positive_integer(
        value: int,
        *,
        field_name: str,
    ) -> int:
        if isinstance(value, bool):
            raise ValueError(
                f"{field_name} must be a positive integer.",
            )
        try:
            normalized = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"{field_name} must be a positive integer.",
            ) from exc
        if normalized <= 0:
            raise ValueError(
                f"{field_name} must be a positive integer.",
            )
        return normalized
