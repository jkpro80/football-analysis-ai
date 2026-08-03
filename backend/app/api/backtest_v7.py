from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.backtest_v7_service import BacktestV7Service


router = APIRouter(
    prefix="/backtest-v7",
    tags=["Backtesting V7"],
)


@router.get("")
def run_backtest_v7(
    limit: int = Query(
        default=20,
        ge=1,
        le=500,
    ),
    history_limit: int = Query(
        default=5,
        ge=1,
        le=20,
    ),
    max_goals: int | None = Query(
        default=None,
        ge=5,
        le=15,
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
):
    try:
        return BacktestV7Service(db=db).run(
            limit=limit,
            history_limit=history_limit,
            max_goals=max_goals,
            top_scores_count=top_scores_count,
            include_details=include_details,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc
