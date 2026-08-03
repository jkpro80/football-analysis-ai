from fastapi import APIRouter, HTTPException

from app.providers.standings_provider import StandingsProvider

router = APIRouter(
    prefix="/standings",
    tags=["Standings"],
)

provider = StandingsProvider()


@router.get("/{season_id}")
def get_standings(season_id: int):
    try:
        return provider.get_simple_table_by_season(season_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
