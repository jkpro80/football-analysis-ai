from typing import Any
import traceback
from app.security import verify_admin_api_key
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
)
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.sportmonks_service import (
    SportmonksAPIError,
)
from app.services.statistics_sync_service import (
    StatisticsSyncService,
)
from app.services.sync_service import (
    SportmonksSyncService,
)


router = APIRouter(
    prefix="/sync",
    tags=["Sync"],
    dependencies=[Depends(verify_admin_api_key)],
)


@router.post(
    "/team/{sportmonks_team_id}",
    response_model=dict[str, Any],
)
async def sync_team(
    sportmonks_team_id: int,
    start_date: str = Query(
        ...,
        description="YYYY-MM-DD",
    ),
    end_date: str = Query(
        ...,
        description="YYYY-MM-DD",
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    مزامنة فريق ومبارياته من Sportmonks.
    """

    try:
        service = SportmonksSyncService(
            db=db,
        )

        return await service.sync_team_and_fixtures(
            sportmonks_team_id=sportmonks_team_id,
            start_date=start_date,
            end_date=end_date,
        )

    except ValueError as error:
        traceback.print_exc()

        raise HTTPException(
            status_code=422,
            detail=f"ValueError: {error}",
        ) from error

    except SportmonksAPIError as error:
        traceback.print_exc()

        raise HTTPException(
            status_code=502,
            detail=f"SportmonksAPIError: {error}",
        ) from error

    except SQLAlchemyError as error:
        db.rollback()
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Database synchronization failed: "
                f"{type(error).__name__}: {error}"
            ),
        ) from error

    except Exception as error:
        db.rollback()
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unexpected synchronization error: "
                f"{type(error).__name__}: {error}"
            ),
        ) from error


@router.post(
    "/fixture/{fixture_sportmonks_id}/statistics",
    response_model=dict[str, Any],
)
@router.post(
    "/teams",
    response_model=dict[str, Any],
)
async def sync_all_teams(
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    مزامنة جميع الفرق من Sportmonks.
    """

    try:
        service = SportmonksSyncService(
            db=db,
        )

        return await service.sync_all_teams()

    except SportmonksAPIError as error:
        traceback.print_exc()

        raise HTTPException(
            status_code=502,
            detail=f"SportmonksAPIError: {error}",
        ) from error

    except SQLAlchemyError as error:
        db.rollback()
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Database synchronization failed: "
                f"{type(error).__name__}: {error}"
            ),
        ) from error

    except Exception as error:
        db.rollback()
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unexpected synchronization error: "
                f"{type(error).__name__}: {error}"
            ),
        ) from error
    
@router.post(
    "/fixture/{fixture_sportmonks_id}/statistics",
    response_model=dict[str, Any],
)
def sync_fixture_statistics(
    fixture_sportmonks_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    مزامنة إحصاءات مباراة واحدة من Sportmonks،
    ثم تحديث تقييم الفريقين تلقائيًا.
    """

    try:
        service = StatisticsSyncService(
            db=db,
        )

        return service.sync_fixture_statistics(
            fixture_sportmonks_id=fixture_sportmonks_id,
        )

    except ValueError as error:
        traceback.print_exc()

        raise HTTPException(
            status_code=404,
            detail=f"ValueError: {error}",
        ) from error

    except SportmonksAPIError as error:
        traceback.print_exc()

        raise HTTPException(
            status_code=502,
            detail=f"SportmonksAPIError: {error}",
        ) from error

    except SQLAlchemyError as error:
        db.rollback()
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Database statistics synchronization failed: "
                f"{type(error).__name__}: {error}"
            ),
        ) from error

    except Exception as error:
        db.rollback()
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unexpected fixture statistics "
                f"synchronization error: "
                f"{type(error).__name__}: {error}"
            ),
        ) from error


@router.post(
    "/team/{sportmonks_team_id}/statistics",
    response_model=dict[str, Any],
)
def sync_all_team_statistics(
    sportmonks_team_id: int,
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
    ),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    مزامنة إحصاءات آخر مباريات فريق دفعة واحدة.
    """

    try:
        service = StatisticsSyncService(
            db=db,
        )

        return service.sync_team_statistics(
            sportmonks_team_id=sportmonks_team_id,
            limit=limit,
        )

    except ValueError as error:
        traceback.print_exc()

        raise HTTPException(
            status_code=404,
            detail=f"ValueError: {error}",
        ) from error

    except SportmonksAPIError as error:
        traceback.print_exc()

        raise HTTPException(
            status_code=502,
            detail=f"SportmonksAPIError: {error}",
        ) from error

    except SQLAlchemyError as error:
        db.rollback()
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Database team statistics "
                f"synchronization failed: "
                f"{type(error).__name__}: {error}"
            ),
        ) from error

    except Exception as error:
        db.rollback()
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unexpected team statistics "
                f"synchronization error: "
                f"{type(error).__name__}: {error}"
            ),
        ) from error