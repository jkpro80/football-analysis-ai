from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import SubscriptionPlan, User
from app.dependencies.auth import get_optional_current_user
from app.engine.prediction_engine_v11 import (
    PredictionEngineError,
    PredictionEngineV11,
)
from app.schemas.prediction_response import PredictionResponse
from app.services.analysis_usage_service import AnalysisUsageService
from app.services.auth_service import AuthService
logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/predictions",
    tags=["Predictions"],
)
@router.get(
    "/{match_id}",
    response_model=PredictionResponse,
    summary="Generate a V11 match prediction",
)
def get_prediction(
    match_id: int,
    include_score_matrix: bool = False,
    include_features: bool = False,
    include_raw_data: bool = False,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(
        get_optional_current_user,
    ),
) -> PredictionResponse:
    """
    Generate a match prediction using Prediction Engine V11.
    Basic predictions remain available without authentication.
    Authenticated users are subject to their subscription plan and
    monthly analysis limit.
    """
    plan_code = "free"
    analysis_limit: int | None = None
    usage_service: AnalysisUsageService | None = None
    if current_user is not None:
        auth_service = AuthService(db)
        subscription = auth_service.get_active_subscription(
            current_user.id,
        )
        if (
            subscription is not None
            and subscription.plan is not None
        ):
            plan_code = str(
                subscription.plan.code,
            ).strip().lower()
            analysis_limit = (
                subscription.plan.analysis_limit
            )
        else:
            free_plan = (
                db.query(SubscriptionPlan)
                .filter(
                    SubscriptionPlan.code == "free",
                    SubscriptionPlan.is_active.is_(True),
                )
                .first()
            )
            if free_plan is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Free subscription plan is not configured.",
                )
            plan_code = "free"
            analysis_limit = free_plan.analysis_limit
        usage_service = AnalysisUsageService(db)
        if (
            analysis_limit is not None
            and not usage_service.has_available_quota(
                user_id=current_user.id,
                analysis_limit=analysis_limit,
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Monthly analysis limit reached.",
            )
    if (
        include_raw_data
        and plan_code != "premium"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required.",
        )
    if (
        (
            include_features
            or include_score_matrix
        )
        and plan_code == "free"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Pro subscription required.",
        )
    try:
        engine = PredictionEngineV11(db=db)
        result = engine.predict(
            match_id=match_id,
            include_score_matrix=include_score_matrix,
            include_features=include_features,
            include_raw_data=include_raw_data,
        )
        response = PredictionResponse.model_validate(
            result,
        )
        if (
            current_user is not None
            and usage_service is not None
        ):
            usage_service.record_usage(
                user_id=current_user.id,
                match_id=match_id,
            )
        return response
    except PredictionEngineError as exc:
        logger.warning(
            "Prediction Engine V11 rejected match_id=%s: %s",
            match_id,
            exc.to_dict(),
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=exc.to_dict(),
        ) from exc
    except (TypeError, ValueError) as exc:
        logger.warning(
            "Invalid V11 prediction request for match_id=%s: %s",
            match_id,
            exc,
        )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        logger.exception(
            "Unexpected V11 prediction failure for match_id=%s",
            match_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate match prediction.",
        ) from exc
