from calendar import monthrange
from calendar import monthrange

from app.services.analysis_usage_service import AnalysisUsageService

from app.schemas.subscription import (
    SubscriptionChangeRequest,
    SubscriptionUsageResponse,
)
from app.schemas.subscription import (
    SubscriptionChangeRequest,
    SubscriptionUsageResponse,
)

from app.services.analysis_usage_service import (
    AnalysisUsageService,
)
from datetime import datetime, timezone
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import (
    SubscriptionPlan,
    User,
    UserSubscription,
)
from app.dependencies.auth import get_current_user
from app.schemas.auth import (
    SubscriptionPlanResponse,
    UserSubscriptionResponse,
)
from app.schemas.subscription import (
    SubscriptionChangeRequest,
)
from app.services.auth_service import AuthService
router = APIRouter(
    prefix="/subscriptions",
    tags=["Subscriptions"],
)
@router.get(
    "/plans",
    response_model=list[SubscriptionPlanResponse],
)
def get_subscription_plans(
    db: Session = Depends(get_db),
) -> list[SubscriptionPlan]:
    return (
        db.query(SubscriptionPlan)
        .filter(
            SubscriptionPlan.is_active.is_(True),
        )
        .order_by(
            SubscriptionPlan.monthly_price.asc(),
            SubscriptionPlan.id.asc(),
        )
        .all()
    )
@router.get(
    "/me",
    response_model=UserSubscriptionResponse | None,
)


def get_my_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    return service.get_active_subscription(
        current_user.id,
    )
@router.get(
    "/usage",
    response_model=SubscriptionUsageResponse,
)
def get_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    auth = AuthService(db)

    subscription = auth.get_active_subscription(
        current_user.id,
    )

    if subscription is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription.",
        )

    usage_service = AnalysisUsageService(db)

    used = usage_service.get_monthly_usage(
        current_user.id,
    )

    limit = subscription.plan.analysis_limit

    remaining = (
        None
        if limit is None
        else max(limit - used, 0)
    )

    now = datetime.now(timezone.utc)

    days = monthrange(
        now.year,
        now.month,
    )[1]

    reset_at = datetime(
        year=now.year,
        month=now.month,
        day=days,
        hour=23,
        minute=59,
        second=59,
        tzinfo=timezone.utc,
    )

    return SubscriptionUsageResponse(
        plan=subscription.plan.code,
        analysis_limit=limit,
        used=used,
        remaining=remaining,
        reset_at=reset_at,
    )
@router.post(
    "/change",
    response_model=UserSubscriptionResponse,
)
def change_subscription(
    payload: SubscriptionChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan_code = payload.plan_code.strip().lower()
    plan = (
        db.query(SubscriptionPlan)
        .filter(
            SubscriptionPlan.code == plan_code,
            SubscriptionPlan.is_active.is_(True),
        )
        .first()
    )
    if plan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subscription plan not found.",
        )
    service = AuthService(db)
    current_subscription = (
        service.get_active_subscription(
            current_user.id,
        )
    )
    if (
        current_subscription is not None
        and current_subscription.plan_id == plan.id
    ):
        return current_subscription
    if float(plan.monthly_price) > 0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=(
                "Payment is required before activating "
                f"the {plan.name} plan."
            ),
        )
    now = datetime.now(timezone.utc)
    try:
        active_subscriptions = (
            db.query(UserSubscription)
            .filter(
                UserSubscription.user_id
                == current_user.id,
                UserSubscription.status == "active",
            )
            .all()
        )
        for subscription in active_subscriptions:
            subscription.status = "cancelled"
            subscription.ends_at = now
            subscription.auto_renew = False
        new_subscription = UserSubscription(
            user_id=current_user.id,
            plan_id=plan.id,
            status="active",
            starts_at=now,
            ends_at=None,
            auto_renew=False,
        )
        db.add(new_subscription)
        db.commit()
        db.refresh(new_subscription)
        return new_subscription
    except Exception:
        db.rollback()
        raise
