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


router = APIRouter(
    prefix="/model",
    tags=["Model"],
)


@router.get(
    "/status",
    response_model=dict[str, Any],
)
def get_model_status(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    عرض حالة نموذج V3.1
    والمعاملات المستخدمة حاليًا.
    """

    try:
        service = ModelTuningService(db)

        status = service.get_status()

        return {
            "active_model": (
                "Prediction Engine V3.1"
                if status["enabled"]
                else "Prediction Engine V3"
            ),
            **status,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to read model status."
            ),
        ) from error


@router.get(
    "/accuracy",
    response_model=dict[str, Any],
)
def get_model_accuracy(
    model_version: str = (
        "Prediction Engine V3.1"
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    عرض تقرير دقة إصدار محدد من النموذج.
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
    إنشاء تقرير معايرة جديد لـV3
    دون حفظ أو تطبيق المعاملات.
    """

    try:
        service = AutoCalibrationService(db)

        return service.calibrate(
            model_version=(
                "Prediction Engine V3"
            ),
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
    تشغيل المعايرة وحفظ معاملات V3.1.
    """

    try:
        service = ModelTuningService(db)

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
    تعطيل V3.1 والعودة إلى معاملات 1.0.
    """

    try:
        service = ModelTuningService(db)

        return service.disable_config()

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to disable "
                "model tuning."
            ),
        ) from error