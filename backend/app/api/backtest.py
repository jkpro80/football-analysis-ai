from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.backtest_service import (
    BacktestService,
)
from app.services.backtest_v31_service import (
    BacktestV31Service,
)


router = APIRouter(
    prefix="/backtest",
    tags=["Backtest"],
)


@router.post(
    "",
    response_model=dict[str, Any],
)
def run_backtest(
    model_version: Literal["v3", "v3.1"] = Query(
        default="v3.1",
    ),
    limit: int = Query(
        default=30,
        ge=1,
        le=500,
    ),
    before_date: str | None = Query(
        default=None,
    ),
    after_date: str | None = Query(
        default=None,
    ),
    skip_existing: bool = Query(
        default=True,
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    تشغيل Backtest على V3 أو V3.1.
    """

    try:
        if model_version == "v3":
            service = BacktestService(db)

        else:
            service = BacktestV31Service(db)

        return service.run_backtest(
            limit=limit,
            before_date=before_date,
            after_date=after_date,
            skip_existing=skip_existing,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to run backtest.",
        ) from error