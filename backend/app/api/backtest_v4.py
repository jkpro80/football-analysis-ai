from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.backtest_v4_service import (
    BacktestV4Service,
)


router = APIRouter(
    prefix="/backtest-v4",
    tags=["Backtest V4"],
)


@router.get(
    "/run",
    response_model=dict[str, Any],
)
def run_backtest_v4(
    limit: int = Query(
        default=100,
        ge=1,
        le=1000,
    ),
    recent_limit: int = Query(
        default=5,
        ge=1,
        le=20,
    ),
    minimum_history: int = Query(
        default=1,
        ge=0,
        le=20,
    ),
    include_results: bool = Query(
        default=False,
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    تشغيل اختبار تاريخي لمحرك V4.
    """

    try:
        service = BacktestV4Service(
            db=db,
        )

        return service.run(
            limit=limit,
            recent_limit=recent_limit,
            minimum_history=(
                minimum_history
            ),
            include_results=(
                include_results
            ),
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to read backtest "
                "data from the database."
            ),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unexpected Backtest V4 "
                "execution error."
            ),
        ) from error