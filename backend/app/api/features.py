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
from app.engine.feature_engine import (
    FeatureEngine,
)


router = APIRouter(
    prefix="/features",
    tags=["Features"],
)


@router.get(
    "/fixture/{fixture_id}",
    response_model=dict[str, Any],
)
def get_fixture_features(
    fixture_id: int,
    recent_limit: int = Query(
        default=5,
        ge=1,
        le=20,
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    عرض جميع خصائص مباراة واحدة.
    """

    try:
        engine = FeatureEngine(
            db=db,
        )

        return engine.build_match_features(
            fixture_id=fixture_id,
            recent_limit=recent_limit,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error),
        ) from error

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load fixture "
                "features."
            ),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unexpected feature "
                "generation error."
            ),
        ) from error