from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.database.models import Match, Team


class MatchFatigueAnalysisError(RuntimeError):
    """Raised when fatigue analysis cannot be completed."""


class MatchFatigueAnalyzer:
    """
    Analyze team rest and fixture congestion before a match.

    The analyzer uses only completed matches that happened before
    the target fixture date.
    """

    MAX_LOOKBACK_MATCHES = 20

    def __init__(
        self,
        db: Session,
    ) -> None:
        if db is None:
            raise ValueError("db session is required.")

        self.db = db

    def analyze(
        self,
        fixture_id: int,
    ) -> dict[str, Any]:
        validated_fixture_id = self._positive_int(
            fixture_id,
            field_name="fixture_id",
        )

        match = self.db.get(
            Match,
            validated_fixture_id,
        )

        if match is None:
            raise MatchFatigueAnalysisError(
                f"Fixture {validated_fixture_id} was not found."
            )

        fixture_date = self._resolve_datetime(
            match.date
        )

        if fixture_date is None:
            raise MatchFatigueAnalysisError(
                f"Fixture {validated_fixture_id} has no valid date."
            )

        home_team_id = int(match.home_team_id)
        away_team_id = int(match.away_team_id)

        teams = self._load_teams(
            home_team_id=home_team_id,
            away_team_id=away_team_id,
        )

        home = self._analyze_team(
            team_id=home_team_id,
            team=teams.get(home_team_id),
            fixture_date=fixture_date,
            excluded_fixture_id=validated_fixture_id,
        )

        away = self._analyze_team(
            team_id=away_team_id,
            team=teams.get(away_team_id),
            fixture_date=fixture_date,
            excluded_fixture_id=validated_fixture_id,
        )

        rest_advantage_days = self._rest_advantage(
            home.get("rest_days"),
            away.get("rest_days"),
        )

        return {
            "fixture_id": validated_fixture_id,
            "fixture_date": fixture_date.isoformat(),
            "home": home,
            "away": away,
            "features": {
                "home_rest_days": home["rest_days"],
                "away_rest_days": away["rest_days"],
                "home_matches_last_7_days": (
                    home["matches_last_7_days"]
                ),
                "away_matches_last_7_days": (
                    away["matches_last_7_days"]
                ),
                "home_matches_last_14_days": (
                    home["matches_last_14_days"]
                ),
                "away_matches_last_14_days": (
                    away["matches_last_14_days"]
                ),
                "home_fatigue_factor": (
                    home["fatigue_factor"]
                ),
                "away_fatigue_factor": (
                    away["fatigue_factor"]
                ),
                "home_congestion_level": (
                    home["congestion_level"]
                ),
                "away_congestion_level": (
                    away["congestion_level"]
                ),
                "rest_advantage_days": rest_advantage_days,
            },
            "warnings": self._build_warnings(
                home=home,
                away=away,
            ),
        }

    def _load_teams(
        self,
        *,
        home_team_id: int,
        away_team_id: int,
    ) -> dict[int, Team]:
        teams = (
            self.db.query(Team)
            .filter(
                Team.id.in_(
                    {
                        home_team_id,
                        away_team_id,
                    }
                )
            )
            .all()
        )

        return {
            int(team.id): team
            for team in teams
        }

    def _analyze_team(
        self,
        *,
        team_id: int,
        team: Team | None,
        fixture_date: datetime,
        excluded_fixture_id: int,
    ) -> dict[str, Any]:
        previous_matches = (
            self.db.query(Match)
            .filter(
                Match.id != excluded_fixture_id,
                Match.date < fixture_date,
                Match.home_score.isnot(None),
                Match.away_score.isnot(None),
                or_(
                    Match.home_team_id == team_id,
                    Match.away_team_id == team_id,
                ),
            )
            .order_by(
                Match.date.desc(),
                Match.id.desc(),
            )
            .limit(self.MAX_LOOKBACK_MATCHES)
            .all()
        )

        previous_dates = [
            resolved
            for resolved in (
                self._resolve_datetime(item.date)
                for item in previous_matches
            )
            if resolved is not None
        ]

        last_match_date = (
            previous_dates[0]
            if previous_dates
            else None
        )

        rest_days = self._days_between(
            last_match_date,
            fixture_date,
        )

        matches_last_7_days = self._count_recent_matches(
            previous_dates,
            fixture_date=fixture_date,
            days=7,
        )

        matches_last_14_days = self._count_recent_matches(
            previous_dates,
            fixture_date=fixture_date,
            days=14,
        )

        congestion_level = self._congestion_level(
            rest_days=rest_days,
            matches_last_7_days=matches_last_7_days,
            matches_last_14_days=matches_last_14_days,
        )

        fatigue_factor = self._fatigue_factor(
            rest_days=rest_days,
            matches_last_7_days=matches_last_7_days,
            matches_last_14_days=matches_last_14_days,
        )

        return {
            "team_id": team_id,
            "team_name": (
                getattr(team, "name", None)
                or f"Team {team_id}"
            ),
            "last_match_date": (
                last_match_date.isoformat()
                if last_match_date is not None
                else None
            ),
            "rest_days": rest_days,
            "matches_last_7_days": matches_last_7_days,
            "matches_last_14_days": matches_last_14_days,
            "congestion_level": congestion_level,
            "fatigue_factor": round(
                fatigue_factor,
                4,
            ),
            "history_matches_found": len(
                previous_matches
            ),
        }

    @staticmethod
    def _fatigue_factor(
        *,
        rest_days: int | None,
        matches_last_7_days: int,
        matches_last_14_days: int,
    ) -> float:
        penalty = 0.0

        if rest_days is not None:
            if rest_days <= 2:
                penalty += 0.07
            elif rest_days == 3:
                penalty += 0.04
            elif rest_days == 4:
                penalty += 0.02

        if matches_last_7_days >= 3:
            penalty += 0.04
        elif matches_last_7_days == 2:
            penalty += 0.02

        if matches_last_14_days >= 5:
            penalty += 0.03
        elif matches_last_14_days == 4:
            penalty += 0.015

        penalty = min(
            penalty,
            0.12,
        )

        return max(
            0.88,
            1.0 - penalty,
        )

    @staticmethod
    def _congestion_level(
        *,
        rest_days: int | None,
        matches_last_7_days: int,
        matches_last_14_days: int,
    ) -> str:
        if (
            rest_days is not None
            and rest_days <= 2
        ) or matches_last_7_days >= 3:
            return "high"

        if (
            rest_days is not None
            and rest_days <= 4
        ) or matches_last_14_days >= 4:
            return "medium"

        return "low"

    @staticmethod
    def _count_recent_matches(
        dates: list[datetime],
        *,
        fixture_date: datetime,
        days: int,
    ) -> int:
        return sum(
            1
            for item in dates
            if 0 < (
                fixture_date - item
            ).total_seconds() <= days * 86400
        )

    @staticmethod
    def _days_between(
        earlier: datetime | None,
        later: datetime,
    ) -> int | None:
        if earlier is None:
            return None

        seconds = (
            later - earlier
        ).total_seconds()

        if seconds <= 0:
            return 0

        return int(
            seconds // 86400
        )

    @staticmethod
    def _rest_advantage(
        home_rest_days: int | None,
        away_rest_days: int | None,
    ) -> int | None:
        if (
            home_rest_days is None
            or away_rest_days is None
        ):
            return None

        return (
            home_rest_days
            - away_rest_days
        )

    @staticmethod
    def _build_warnings(
        *,
        home: dict[str, Any],
        away: dict[str, Any],
    ) -> list[str]:
        warnings: list[str] = []

        if home["rest_days"] is None:
            warnings.append(
                "Home previous match date is unavailable."
            )

        if away["rest_days"] is None:
            warnings.append(
                "Away previous match date is unavailable."
            )

        return warnings

    @staticmethod
    def _resolve_datetime(
        value: Any,
    ) -> datetime | None:
        if isinstance(value, datetime):
            return value

        if isinstance(value, str):
            normalized = value.strip()

            if not normalized:
                return None

            try:
                return datetime.fromisoformat(
                    normalized.replace(
                        "Z",
                        "+00:00",
                    )
                )
            except ValueError:
                return None

        return None

    @staticmethod
    def _positive_int(
        value: Any,
        *,
        field_name: str,
    ) -> int:
        if isinstance(value, bool):
            raise ValueError(
                f"{field_name} must be an integer."
            )

        try:
            resolved = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"{field_name} must be an integer."
            ) from exc

        if resolved <= 0:
            raise ValueError(
                f"{field_name} must be positive."
            )

        return resolved
