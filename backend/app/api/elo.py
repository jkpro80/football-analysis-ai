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
from app.services.elo_service import EloService
from app.security import verify_admin_api_key

router = APIRouter(
    prefix="/elo",
    tags=["ELO"],
    dependencies=[Depends(verify_admin_api_key)],
)

@router.get(
    "/fixture/{fixture_id}/preview",
    response_model=dict[str, Any],
)
def preview_fixture_elo(
    fixture_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    معاينة تحديث ELO دون حفظه.
    """

    try:
        service = EloService(
            db=db,
        )

        return service.preview_fixture_update(
            fixture_id=fixture_id,
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
                "Failed to read fixture "
                "ELO data."
            ),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unexpected ELO preview error."
            ),
        ) from error


@router.post(
    "/fixture/{fixture_id}/apply",
    response_model=dict[str, Any],
)
def apply_fixture_elo(
    fixture_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    تطبيق تحديث ELO مرة واحدة فقط.
    """

    try:
        service = EloService(
            db=db,
        )

        return service.apply_fixture_update(
            fixture_id=fixture_id,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=409,
            detail=str(error),
        ) from error

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to save fixture "
                "ELO ratings."
            ),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unexpected ELO update error."
            ),
        ) from error


@router.post(
    "/apply-pending",
    response_model=dict[str, Any],
)
def apply_pending_elo(
    limit: int = Query(
        default=50,
        ge=1,
        le=500,
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    تطبيق ELO على المباريات المنتهية
    التي لم تُعالج سابقًا.

    تتم المعالجة من الأقدم إلى الأحدث.
    """

    try:
        service = EloService(
            db=db,
        )

        return service.apply_pending_fixtures(
            limit=limit,
        )

    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to apply pending "
                "ELO updates."
            ),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=(
                "Unexpected pending ELO "
                "update error."
            ),
        ) from error