from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.backtest_v11_service import (
    BacktestV11Service,
)


router = APIRouter(
    prefix="/backtest",
    tags=["Backtest V11"],
)


@router.post(
    "",
    response_model=dict[str, Any],
)
def run_backtest(
    limit: int = Query(
        default=100,
        ge=1,
        le=1000,
    ),
    history_limit: int = Query(
        default=5,
        ge=1,
        le=20,
    ),
    max_goals: int | None = Query(
        default=None,
        ge=1,
        le=20,
    ),
    top_scores_count: int | None = Query(
        default=None,
        ge=1,
        le=50,
    ),
    include_details: bool = Query(
        default=True,
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    تشغيل Backtest على Prediction Engine V11
    باستخدام نفس MatchAnalysisPipelineV11
    المستخدم في الإنتاج.
    """

    try:
        service = BacktestV11Service(db)

        return service.run(
            limit=limit,
            history_limit=history_limit,
            max_goals=max_goals,
            top_scores_count=top_scores_count,
            include_details=include_details,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to run V11 backtest.",
        ) from error
