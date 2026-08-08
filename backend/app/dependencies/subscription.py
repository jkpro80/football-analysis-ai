from collections.abc import Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import User
from app.dependencies.auth import get_current_user
from app.services.auth_service import AuthService
PLAN_RANKS = {
    "free": 0,
    "pro": 10,
    "premium": 20,
}
def require_plan(
    minimum_plan: str,
) -> Callable:
    required_code = minimum_plan.strip().lower()
    if required_code not in PLAN_RANKS:
        raise ValueError(
            f"Unknown subscription plan: {minimum_plan}"
        )
    def dependency(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        service = AuthService(db)
        subscription = service.get_active_subscription(
            current_user.id,
        )
        if subscription is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="An active subscription is required.",
            )
        plan = subscription.plan
        if plan is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Subscription plan is unavailable.",
            )
        current_code = str(
            plan.code
        ).strip().lower()
        current_rank = PLAN_RANKS.get(
            current_code,
            -1,
        )
        required_rank = PLAN_RANKS[
            required_code
        ]
        if current_rank < required_rank:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"The {minimum_plan} plan or higher "
                    "is required for this feature."
                ),
            )
        return current_user
    return dependency
require_pro = require_plan("pro")
require_premium = require_plan("premium")
