from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.auto_calibration_service import (
    AutoCalibrationService,
)
from app.services.model_accuracy_service import (
    ModelAccuracyService,
)
from app.services.model_tuning_service import (
    ModelTuningService,
)
from app.services.prediction_v11_record_service import (
    PredictionV11RecordService,
)


router = APIRouter(
    prefix="/model",
    tags=["Model"],
)

V11_MODEL_VERSION = PredictionV11RecordService.MODEL_VERSION
V11_TUNED_MODEL_VERSION = "Prediction Engine V11.1"
V11_CONFIG_PATH = "/app/app/config/model_weights_v11.json"


def get_v11_tuning_service(
    db: Session,
) -> ModelTuningService:
    return ModelTuningService(
        db=db,
        source_model_version=V11_MODEL_VERSION,
        tuned_model_version=V11_TUNED_MODEL_VERSION,
        config_path=V11_CONFIG_PATH,
    )


@router.get(
    "/status",
    response_model=dict[str, Any],
)
def get_model_status(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    عرض حالة نموذج V11
    ومعاملات V11.1 المستخدمة حاليًا.
    """

    try:
        service = get_v11_tuning_service(db)

        status = service.get_status()

        return {
            "active_model": (
                V11_TUNED_MODEL_VERSION
                if status["enabled"]
                else V11_MODEL_VERSION
            ),
            **status,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to read model status.",
        ) from error


@router.get(
    "/accuracy",
    response_model=dict[str, Any],
)
def get_model_accuracy(
    model_version: str = V11_MODEL_VERSION,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    عرض تقرير دقة Prediction Engine V11.
    """

    try:
        service = ModelAccuracyService(db)

        return service.get_accuracy_report(
            model_version=model_version
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate "
                "the accuracy report."
            ),
        ) from error


@router.get(
    "/calibration",
    response_model=dict[str, Any],
)
def get_model_calibration(
    limit: int | None = None,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    إنشاء تقرير معايرة لـV11
    دون تطبيق معاملات V11.1.
    """

    try:
        service = AutoCalibrationService(db)

        return service.calibrate(
            model_version=V11_MODEL_VERSION,
            limit=limit,
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate "
                "the calibration report."
            ),
        ) from error


@router.post(
    "/tuning",
    response_model=dict[str, Any],
)
def save_model_tuning(
    limit: int | None = None,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    تشغيل المعايرة وحفظ معاملات V11.1.
    """

    try:
        service = get_v11_tuning_service(db)

        return service.save_config(
            limit=limit
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save "
                "model tuning."
            ),
        ) from error


@router.post(
    "/disable",
    response_model=dict[str, Any],
)
def disable_model_tuning(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    تعطيل معاملات V11.1 والعودة إلى V11 الأساسي.
    """

    try:
        service = get_v11_tuning_service(db)

        return service.disable_config()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to disable "
                "model tuning."
            ),
        ) from error
