from datetime import date, datetime, time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Match, MatchOdd, Team


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
    team_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    league_name: str | None = None,
    season_name: str | None = None,
    status: str | None = None,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[dict[str, Any]]:
    """
    جلب قائمة المباريات مع بيانات الفريقين.
    يمكن تصفية النتائج حسب team_id.
    """

    safe_limit = max(
        1,
        min(limit, 500),
    )
    safe_offset = max(offset, 0)

    if (
        date_from is not None
        and date_to is not None
        and date_from > date_to
    ):
        raise HTTPException(
            status_code=422,
            detail="date_from must be before or equal to date_to.",
        )

    try:
        query = db.query(Match)

        if team_id is not None:
            query = query.filter(
                (Match.home_team_id == team_id)
                | (Match.away_team_id == team_id)
            )

        if date_from is not None:
            query = query.filter(
                Match.date >= datetime.combine(
                    date_from,
                    time.min,
                )
            )

        if date_to is not None:
            query = query.filter(
                Match.date <= datetime.combine(
                    date_to,
                    time.max,
                )
            )

        if league_name:
            query = query.filter(
                Match.league_name == league_name.strip()
            )

        if season_name:
            query = query.filter(
                Match.season_name == season_name.strip()
            )

        if status:
            query = query.filter(
                Match.status == status.strip()
            )

        matches = (
            query
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
            )
            .offset(safe_offset)
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
    "/stats/summary",
    response_model=dict[str, int],
)
def get_match_stats_summary(
    db: Session = Depends(get_db),
) -> dict[str, int]:
    """
    Lightweight dashboard match counts.
    """

    now = datetime.utcnow()

    scheduled_statuses = (
        "1",
        "2",
        "ns",
        "scheduled",
        "not_started",
        "pending",
    )

    live_statuses = (
        "3",
        "4",
        "live",
        "inplay",
        "in-play",
        "halftime",
        "ht",
    )

    normalized_status = func.lower(
        func.trim(
            func.coalesce(
                Match.status,
                "",
            )
        )
    )

    scheduled = (
        db.query(func.count(Match.id))
        .filter(
            Match.date >= now,
            normalized_status.in_(scheduled_statuses),
        )
        .scalar()
        or 0
    )

    live = (
        db.query(func.count(Match.id))
        .filter(
            normalized_status.in_(live_statuses),
        )
        .scalar()
        or 0
    )

    return {
        "scheduled": int(scheduled),
        "live": int(live),
    }


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

@router.get("/{match_id}/odds", response_model=dict[str, Any])
def get_match_odds(
    match_id: int,
    include_stopped: bool = False,
    market_id: int | None = None,
    bookmaker_id: int | None = None,
    limit: int = 500,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    match = db.query(Match).filter(Match.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")

    query = db.query(MatchOdd).filter(MatchOdd.match_id == match_id)
    if not include_stopped:
        query = query.filter(MatchOdd.stopped.is_(False))
    if market_id is not None:
        query = query.filter(MatchOdd.market_id == market_id)
    if bookmaker_id is not None:
        query = query.filter(MatchOdd.bookmaker_id == bookmaker_id)

    safe_limit = max(1, min(limit, 2000))
    rows = query.order_by(MatchOdd.market_id.asc(), MatchOdd.sort_order.asc(), MatchOdd.decimal_odds.desc()).limit(safe_limit).all()

    odds = [
        {
            "id": row.id,
            "provider_odd_id": row.provider_odd_id,
            "market_id": row.market_id,
            "market_name": row.market_name,
            "market_developer_name": row.market_developer_name,
            "market_description": row.market_description,
            "bookmaker_id": row.bookmaker_id,
            "bookmaker_name": row.bookmaker_name,
            "label": row.label,
            "selection_name": row.selection_name,
            "decimal_odds": row.decimal_odds,
            "probability": row.probability,
            "total": row.total,
            "handicap": row.handicap,
            "stopped": row.stopped,
            "latest_bookmaker_update": row.latest_bookmaker_update,
        }
        for row in rows
    ]
    return {"match_id": match.id, "fixture_id": match.sportmonks_id, "count": len(odds), "odds": odds}


@router.get("/{match_id}/odds/summary", response_model=dict[str, Any])
def get_match_odds_summary(match_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    match = db.query(Match).filter(Match.id == match_id).first()
    if match is None:
        raise HTTPException(status_code=404, detail="Match not found")

    primary_markets = {1: "Fulltime Result", 2: "Double Chance", 6: "Asian Handicap", 14: "Both Teams To Score", 67: "Corners", 80: "Goals Over/Under"}
    rows = db.query(MatchOdd).filter(MatchOdd.match_id == match_id, MatchOdd.stopped.is_(False), MatchOdd.market_id.in_(primary_markets.keys())).all()
    grouped: dict[int, dict[str, Any]] = {}

    def canonical(row: MatchOdd) -> tuple[str, str | None] | None:
        label = str(row.label or row.selection_name or "").strip()
        low = label.lower()
        if row.market_id == 1:
            if low in ("home", "draw", "away"):
                return low.title(), None
            return None
        if row.market_id == 2:
            if low == "home/draw" or ("draw" in low and "away" not in low and "/" not in low): return "1X", None
            if low == "home/away" or (" or " in low and "draw" not in low): return "12", None
            if low == "draw/away" or (low.startswith("draw or ")): return "X2", None
            return None
        if row.market_id == 14:
            if low in ("yes", "no"): return low.title(), None
            return None
        if row.market_id == 80:
            if str(row.total or "") != "2.5" or low not in ("over", "under"): return None
            return low.title(), "2.5"
        if row.market_id == 67:
            if str(row.total or "") != "9.5" or low not in ("over", "under"): return None
            return low.title(), "9.5"
        if row.market_id == 6:
            handicap = str(row.handicap or "").strip()
            if handicap not in ("0", "+0") or low not in ("home", "away"): return None
            return low.title(), "0"
        return None

    for row in rows:
        normalized = canonical(row)
        if normalized is None:
            continue
        label, line = normalized
        market = grouped.setdefault(row.market_id, {"market_id": row.market_id, "market_name": row.market_name or primary_markets[row.market_id], "selections": {}})
        key = label
        current = market["selections"].get(key)
        if current is None or row.decimal_odds > current["decimal_odds"]:
            market["selections"][key] = {"label": label, "name": label, "total": line if row.market_id in (67, 80) else None, "handicap": line if row.market_id == 6 else None, "decimal_odds": row.decimal_odds, "probability": row.probability, "bookmaker_id": row.bookmaker_id, "bookmaker_name": row.bookmaker_name, "latest_bookmaker_update": row.latest_bookmaker_update}

    order = {1: ("Home", "Draw", "Away"), 2: ("1X", "12", "X2"), 6: ("Home", "Away"), 14: ("Yes", "No"), 67: ("Over", "Under"), 80: ("Over", "Under")}
    markets = []
    for market_id in primary_markets:
        market = grouped.get(market_id)
        if market:
            selections = market["selections"]
            market["selections"] = [selections[key] for key in order[market_id] if key in selections]
            if market["selections"]:
                markets.append(market)

    return {"match_id": match.id, "fixture_id": match.sportmonks_id, "markets_count": len(markets), "markets": markets}
