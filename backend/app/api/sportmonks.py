from typing import Any

from fastapi import (
    APIRouter,
    HTTPException,
    Query,
)

from app.services.sportmonks_service import (
    SportmonksAPIError,
    SportmonksService,
)

router = APIRouter(
    prefix="/sportmonks",
    tags=["Sportmonks"],
)

@router.get(
    "/teams/search/{name}",
    response_model=dict[str, Any],
)
async def search_sportmonks_teams(
    name: str,
) -> dict[str, Any]:
    try:
        service = SportmonksService()
        return await service.search_teams(name)

    except SportmonksAPIError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error

@router.get(
    "/teams",
    response_model=dict[str, Any],
)
async def get_available_sportmonks_teams(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=50),
) -> dict[str, Any]:
    """
    عرض الفرق المتاحة ضمن اشتراك Sportmonks الحالي.
    """

    try:
        service = SportmonksService()

        return await service.get_all_teams(
            page=page,
            per_page=per_page,
        )

    except SportmonksAPIError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error
@router.get(
    "/teams/{team_id}",
    response_model=dict[str, Any],
)
async def get_sportmonks_team(
    team_id: int,
) -> dict[str, Any]:
    """
    اختبار جلب فريق من Sportmonks.
    """

    try:
        service = SportmonksService()

        return await service.get_team(
            sportmonks_team_id=team_id,
        )

    except SportmonksAPIError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error


@router.get(
    "/teams/{team_id}/fixtures",
    response_model=dict[str, Any],
)
async def get_sportmonks_team_fixtures(
    team_id: int,
    start_date: str = Query(
        ...,
        description="YYYY-MM-DD",
    ),
    end_date: str = Query(
        ...,
        description="YYYY-MM-DD",
    ),
) -> dict[str, Any]:
    """
    اختبار جلب مباريات فريق بين تاريخين.
    """

    try:
        service = SportmonksService()

        return await service.get_team_fixtures(
            sportmonks_team_id=team_id,
            start_date=start_date,
            end_date=end_date,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    except SportmonksAPIError as error:
        raise HTTPException(
            status_code=502,
            detail=str(error),
        ) from error