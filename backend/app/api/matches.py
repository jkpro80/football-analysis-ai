from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Match, Team


router = APIRouter(
    prefix="/matches",
    tags=["Matches"],
)


def serialize_match(
    match: Match,
    home_team: Team | None,
    away_team: Team | None,
) -> dict[str, Any]:

    return {
        "id": match.id,
        "sportmonks_id": match.sportmonks_id,

        "home_team_id": match.home_team_id,
        "away_team_id": match.away_team_id,

        "home_team": home_team.name if home_team else "Unknown",
        "away_team": away_team.name if away_team else "Unknown",

        "home_logo": home_team.logo_url if home_team else None,
        "away_logo": away_team.logo_url if away_team else None,

        "home_country": home_team.country if home_team else None,
        "away_country": away_team.country if away_team else None,

        "date": match.date,
        "status": match.status,
        "home_score": match.home_score,
        "away_score": match.away_score,

        # ===== البيانات الجديدة =====

        "league_name": match.league_name,
        "league_logo": match.league_logo,

        "season_name": match.season_name,
        "round_name": match.round_name,
        "stage_name": match.stage_name,

        "venue_name": match.venue_name,
        "venue_city": match.venue_city,
        "venue_capacity": match.venue_capacity,
        "venue_image": match.venue_image,

        "referee_name": match.referee_name,
    }
@router.get(
    "",
    response_model=list[dict[str, Any]],
)
def get_matches(
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    جلب قائمة المباريات مع بيانات الفريقين.
    """

    safe_limit = max(
        1,
        min(limit, 500),
    )

    try:
        matches = (
            db.query(Match)
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
            )
            .limit(safe_limit)
            .all()
        )

        results: list[dict[str, Any]] = []

        for match in matches:
            home_team = db.get(
                Team,
                match.home_team_id,
            )

            away_team = db.get(
                Team,
                match.away_team_id,
            )

            results.append(
                serialize_match(
                    match=match,
                    home_team=home_team,
                    away_team=away_team,
                )
            )

        return results

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail="Failed to load matches.",
        ) from error


@router.get(
    "/{match_id}",
    response_model=dict[str, Any],
)
def get_match(
    match_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """
    جلب مباراة واحدة مع بيانات الفريقين.
    """

    match = db.get(
        Match,
        match_id,
    )

    if match is None:
        raise HTTPException(
            status_code=404,
            detail="Match not found.",
        )

    home_team = db.get(
        Team,
        match.home_team_id,
    )

    away_team = db.get(
        Team,
        match.away_team_id,
    )

    return serialize_match(
        match=match,
        home_team=home_team,
        away_team=away_team,
    )