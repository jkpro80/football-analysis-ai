from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.latest.mapper_v11 import PredictionMapperV11
from app.api.latest.schemas import LatestPredictionResponse
from app.database.database import get_db
from app.database.models import Match
from app.services.prediction_v11_service import PredictionV11Service
from app.services.prediction_v11_upcoming_service import PredictionV11UpcomingService


router = APIRouter(
    prefix="/predictions/latest",
    tags=["Latest Predictions"],
)


@router.get("/upcoming")
def get_latest_upcoming_predictions(
    limit: int = Query(default=50, ge=1, le=100),
    history_limit: int = Query(default=5, ge=1, le=20),
    max_goals: int = Query(default=8, ge=5, le=15),
    top_scores_count: int = Query(
        default=10,
        ge=1,
        le=20,
    ),
    db: Session = Depends(get_db),
):
    """
    جلب توقعات المباريات القادمة.

    ملاحظة:
    ما زالت هذه الواجهة تستخدم خدمة التوافق القديمة
    إلى حين إنشاء PredictionV11UpcomingService.
    """

    try:
        service = PredictionV11UpcomingService(
            db=db,
            max_goals=max_goals,
            top_scores_count=top_scores_count,
        )

        return service.get_upcoming_predictions(
            limit=limit,
            history_limit=history_limit,
        )

    except Exception as exc:
        import traceback

        print(
            "\n========== "
            "Latest Upcoming Predictions Error "
            "=========="
        )
        traceback.print_exc()
        print(
            "================================"
            "=========================\n"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "حدث خطأ أثناء إنشاء توقعات "
                "المباريات القادمة."
            ),
        ) from exc

@router.get("")
def get_latest_predictions(
    limit: int = Query(default=50, ge=1, le=100),
    history_limit: int = Query(default=5, ge=1, le=20),
    max_goals: int = Query(default=8, ge=5, le=15),
    top_scores_count: int = Query(
        default=10,
        ge=1,
        le=20,
    ),
    db: Session = Depends(get_db),
):
    """
    جلب أحدث التوقعات (يشمل المباريات المنتهية).
    """

    try:
        service = PredictionV11UpcomingService(
            db=db,
            max_goals=max_goals,
            top_scores_count=top_scores_count,
        )

        return service.get_latest_predictions(
            limit=limit,
            history_limit=history_limit,
        )

    except Exception as exc:
        import traceback

        print(
            "\n========== Latest Predictions Error =========="
        )
        traceback.print_exc()
        print(
            "==============================================\n"
        )

        raise HTTPException(
            status_code=500,
            detail="حدث خطأ أثناء إنشاء أحدث التوقعات.",
        ) from exc
@router.get("/finished")
def get_latest_finished_predictions(
    limit: int = Query(default=50, ge=1, le=100),
    history_limit: int = Query(default=5, ge=1, le=20),
    max_goals: int = Query(default=8, ge=5, le=15),
    top_scores_count: int = Query(
        default=10,
        ge=1,
        le=20,
    ),
    db: Session = Depends(get_db),
):
    """
    جلب أحدث توقعات المباريات المنتهية.
    """

    service = PredictionV11UpcomingService(
        db=db,
        max_goals=max_goals,
        top_scores_count=top_scores_count,
    )

    return service.get_finished_predictions(
        limit=limit,
        history_limit=history_limit,
    )

@router.get(
    "/{match_id}",
    response_model=LatestPredictionResponse,
)
def get_latest_prediction(
    match_id: int,
    history_limit: int = Query(default=5, ge=1, le=20),
    max_goals: int = Query(default=8, ge=5, le=15),
    top_scores_count: int = Query(
        default=10,
        ge=1,
        le=20,
    ),
    db: Session = Depends(get_db),
):
    """
    الواجهة الموحدة لأحدث محرك توقعات V11.
    """

    try:
        prediction_service = PredictionV11Service(db=db)

        result = prediction_service.predict_match(
            match_id=match_id,
            history_limit=history_limit,
            max_goals=max_goals,
            top_scores_count=top_scores_count,
        )

        mapped = PredictionMapperV11.to_latest(result)

        match_statement = (
            select(Match)
            .options(
                joinedload(Match.home_team),
                joinedload(Match.away_team),
            )
            .where(Match.id == match_id)
        )

        match = db.scalar(match_statement)

        if match is None:
            raise ValueError(
                f"Match with id {match_id} was not found."
            )

        compatibility = (
            PredictionV11UpcomingService.build_home_compatibility(
                match=match,
                mapped=mapped,
                result=result,
            )
        )

        match_metadata = {
            "league": compatibility.get("league"),
            "season": compatibility.get("season"),
            "round": compatibility.get("round"),
            "stage": compatibility.get("stage"),
            "venue": compatibility.get("venue"),
            "referee": compatibility.get("referee"),
        }

        return LatestPredictionResponse(
            api_version="Latest Prediction API V1",
            engine_version=result.get(
                "model",
                "Prediction Engine V11 11.0.1",
            ),
            **mapped,
            **match_metadata,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except (
        TypeError,
        AttributeError,
        RuntimeError,
    ) as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        import traceback

        print(
            "\n========== "
            "Latest Prediction API Error "
            "=========="
        )
        traceback.print_exc()
        print(
            "================================"
            "=================\n"
        )

        raise HTTPException(
            status_code=500,
            detail="حدث خطأ أثناء إنشاء توقع المباراة.",
        ) from exc

