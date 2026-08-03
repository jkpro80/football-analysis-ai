from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.models import Match


def get_recent_team_form(
    db: Session,
    team_id: int,
    limit: int = 5,
    before_date: str | None = None,
    exclude_match_id: int | None = None,
    venue: str | None = None,
) -> dict[str, Any]:

    safe_limit = max(1, min(limit, 20))

    query = db.query(Match).filter(
        Match.status == "finished",
        Match.home_score.isnot(None),
        Match.away_score.isnot(None),
        or_(
            Match.home_team_id == team_id,
            Match.away_team_id == team_id,
        ),
    )

    if venue == "home":
        query = query.filter(
            Match.home_team_id == team_id
        )

    elif venue == "away":
        query = query.filter(
            Match.away_team_id == team_id
        )

    if before_date:
        query = query.filter(
            Match.date < before_date
        )

    if exclude_match_id is not None:
        query = query.filter(
            Match.id != exclude_match_id
        )

    matches = (
        query.order_by(
            Match.date.desc(),
            Match.id.desc(),
        )
        .limit(safe_limit)
        .all()
    )

    if not matches:
        return {
            "team_id": team_id,
            "matches_played": 0,
            "wins": 0,
            "draws": 0,
            "losses": 0,
            "form": "",
            "points": 0,
            "points_per_game": 0.0,
            "goals_scored": 0,
            "goals_conceded": 0,
            "average_goals_scored": 0.0,
            "average_goals_conceded": 0.0,
            "clean_sheets": 0,
            "clean_sheet_percentage": 0.0,
            "failed_to_score": 0,
            "failed_to_score_percentage": 0.0,
            "matches": [],
        }

    wins = draws = losses = 0
    total_goals_scored = 0
    total_goals_conceded = 0
    clean_sheets = 0
    failed_to_score = 0

    form_results: list[str] = []
    match_details: list[dict[str, Any]] = []

    for match in reversed(matches):

        is_home = (
            match.home_team_id == team_id
        )

        if is_home:
            goals_scored = int(match.home_score or 0)
            goals_conceded = int(match.away_score or 0)
            opponent_id = match.away_team_id
            current_venue = "home"
        else:
            goals_scored = int(match.away_score or 0)
            goals_conceded = int(match.home_score or 0)
            opponent_id = match.home_team_id
            current_venue = "away"

        total_goals_scored += goals_scored
        total_goals_conceded += goals_conceded

        if goals_conceded == 0:
            clean_sheets += 1

        if goals_scored == 0:
            failed_to_score += 1

        if goals_scored > goals_conceded:
            wins += 1
            result = "W"
        elif goals_scored < goals_conceded:
            losses += 1
            result = "L"
        else:
            draws += 1
            result = "D"

        form_results.append(result)

        match_details.append(
            {
                "match_id": match.id,
                "date": match.date,
                "opponent_id": opponent_id,
                "venue": current_venue,
                "goals_scored": goals_scored,
                "goals_conceded": goals_conceded,
                "result": result,
            }
        )

    matches_played = len(matches)
    points = wins * 3 + draws

    return {
        "team_id": team_id,
        "matches_played": matches_played,
        "wins": wins,
        "draws": draws,
        "losses": losses,
        "form": "".join(form_results),
        "points": points,
        "points_per_game": round(points / matches_played, 2),
        "goals_scored": total_goals_scored,
        "goals_conceded": total_goals_conceded,
        "average_goals_scored": round(total_goals_scored / matches_played, 2),
        "average_goals_conceded": round(total_goals_conceded / matches_played, 2),
        "clean_sheets": clean_sheets,
        "clean_sheet_percentage": round(clean_sheets / matches_played * 100, 1),
        "failed_to_score": failed_to_score,
        "failed_to_score_percentage": round(failed_to_score / matches_played * 100, 1),
        "matches": match_details,
    }