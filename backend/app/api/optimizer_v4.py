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
from app.services.model_optimizer_v4_service import (
    ModelOptimizerV4Service,
)


router = APIRouter(
    prefix="/optimizer-v4",
    tags=["Optimizer V4"],
)


@router.get(
    "/run",
    response_model=dict[str, Any],
)
def run_optimizer_v4(
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
        default=3,
        ge=0,
        le=20,
    ),
    max_configs: int = Query(
        default=20,
        ge=1,
        le=200,
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    تجربة إعدادات V4 واختيار الأفضل.

    يفضل البدء بعدد صغير من الإعدادات.
    """

    try:
        service = (
            ModelOptimizerV4Service(
                db=db,
            )
        )

        return service.optimize(
            limit=limit,
            recent_limit=recent_limit,
            minimum_history=(
                minimum_history
            ),
            max_configs=max_configs,
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
                "Database error while "
                "running Optimizer V4."
            ),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unexpected Optimizer V4 "
                "execution error."
            ),
        ) from error