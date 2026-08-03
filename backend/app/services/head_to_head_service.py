from typing import Any

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.database.models import Match


def get_head_to_head(
    db: Session,
    home_team_id: int,
    away_team_id: int,
    limit: int = 5,
    before_date: str | None = None,
    exclude_match_id: int | None = None,
) -> dict[str, Any]:
    """
    جلب آخر المواجهات المباشرة بين فريقين
    قبل تاريخ محدد.
    """

    if home_team_id == away_team_id:
        raise ValueError(
            "Teams must be different."
        )

    safe_limit = max(
        1,
        min(limit, 20),
    )

    query = db.query(Match).filter(
        Match.status == "finished",
        Match.home_score.isnot(None),
        Match.away_score.isnot(None),
        or_(
            and_(
                Match.home_team_id
                == home_team_id,
                Match.away_team_id
                == away_team_id,
            ),
            and_(
                Match.home_team_id
                == away_team_id,
                Match.away_team_id
                == home_team_id,
            ),
        ),
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
        query
        .order_by(
            Match.date.desc(),
            Match.id.desc(),
        )
        .limit(safe_limit)
        .all()
    )

    home_wins = 0
    away_wins = 0
    draws = 0

    home_goals = 0
    away_goals = 0

    both_teams_scored = 0
    over_2_5 = 0

    match_details: list[
        dict[str, Any]
    ] = []

    for match in reversed(matches):
        original_home_score = int(
            match.home_score or 0
        )

        original_away_score = int(
            match.away_score or 0
        )

        if (
            match.home_team_id
            == home_team_id
        ):
            selected_home_goals = (
                original_home_score
            )

            selected_away_goals = (
                original_away_score
            )

            venue_for_home_team = "home"

        else:
            selected_home_goals = (
                original_away_score
            )

            selected_away_goals = (
                original_home_score
            )

            venue_for_home_team = "away"

        home_goals += selected_home_goals
        away_goals += selected_away_goals

        if (
            selected_home_goals
            > selected_away_goals
        ):
            home_wins += 1
            result = "home_win"

        elif (
            selected_home_goals
            < selected_away_goals
        ):
            away_wins += 1
            result = "away_win"

        else:
            draws += 1
            result = "draw"

        if (
            selected_home_goals > 0
            and selected_away_goals > 0
        ):
            both_teams_scored += 1

        if (
            selected_home_goals
            + selected_away_goals
            > 2
        ):
            over_2_5 += 1

        match_details.append(
            {
                "match_id": match.id,
                "date": match.date,
                "venue_for_home_team": (
                    venue_for_home_team
                ),
                "home_team_goals": (
                    selected_home_goals
                ),
                "away_team_goals": (
                    selected_away_goals
                ),
                "result": result,
            }
        )

    matches_played = len(matches)

    if matches_played == 0:
        return {
            "home_team_id": (
                home_team_id
            ),
            "away_team_id": (
                away_team_id
            ),
            "matches_played": 0,
            "home_wins": 0,
            "draws": 0,
            "away_wins": 0,
            "home_goals": 0,
            "away_goals": 0,
            "average_total_goals": 0.0,
            "home_win_percentage": 0.0,
            "draw_percentage": 0.0,
            "away_win_percentage": 0.0,
            "btts_percentage": 0.0,
            "over_2_5_percentage": 0.0,
            "matches": [],
        }

    total_goals = (
        home_goals + away_goals
    )

    return {
        "home_team_id": home_team_id,
        "away_team_id": away_team_id,
        "matches_played": (
            matches_played
        ),
        "home_wins": home_wins,
        "draws": draws,
        "away_wins": away_wins,
        "home_goals": home_goals,
        "away_goals": away_goals,
        "average_total_goals": round(
            total_goals / matches_played,
            2,
        ),
        "home_win_percentage": round(
            home_wins
            / matches_played
            * 100,
            1,
        ),
        "draw_percentage": round(
            draws
            / matches_played
            * 100,
            1,
        ),
        "away_win_percentage": round(
            away_wins
            / matches_played
            * 100,
            1,
        ),
        "btts_percentage": round(
            both_teams_scored
            / matches_played
            * 100,
            1,
        ),
        "over_2_5_percentage": round(
            over_2_5
            / matches_played
            * 100,
            1,
        ),
        "matches": match_details,
    }