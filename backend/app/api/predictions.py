from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.engine.prediction_engine_v11 import (
    PredictionEngineError,
    PredictionEngineV11,
)
from app.schemas.prediction_response import PredictionResponse


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
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """
    إنشاء توقع مباراة باستخدام Prediction Engine V11.

    هذا هو المسار الرسمي والموحد لمحرك التوقعات.
    """

    try:
        engine = PredictionEngineV11(db=db)
        result = engine.predict(
            match_id=match_id,
            include_score_matrix=include_score_matrix,
        )

        return PredictionResponse.model_validate(result)

    except PredictionEngineError as exc:
        logger.warning(
            "Prediction Engine V11 rejected match_id=%s: %s",
            match_id,
            exc.to_dict(),
        )

        raise HTTPException(
            status_code=404,
            detail=exc.to_dict(),
        ) from exc

    except (TypeError, ValueError) as exc:
        logger.warning(
            "Invalid V11 prediction request for match_id=%s: %s",
            match_id,
            exc,
        )

        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "Unexpected V11 prediction failure for match_id=%s",
            match_id,
        )

        raise HTTPException(
            status_code=500,
            detail="حدث خطأ أثناء إنشاء توقع المباراة.",
        ) from exc
