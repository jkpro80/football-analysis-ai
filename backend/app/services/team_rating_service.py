from collections.abc import Iterable
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.engine.elo_rating_engine import EloRatingEngine
from app.models.match import Match


class TeamRatingService:
    DEFAULT_RATING = 1500.0

    COMPLETED_STATUSES = {
        "finished",
        "complete",
        "completed",
        "ended",
        "ft",
        "aet",
        "after extra time",
        "after penalties",
        "penalties",
    }

    def __init__(
        self,
        db: Session,
        elo_engine: EloRatingEngine | None = None,
        default_rating: float = DEFAULT_RATING,
    ) -> None:
        if db is None:
            raise ValueError("db is required")

        if default_rating <= 0:
            raise ValueError("default_rating must be greater than zero")

        self.db = db
        self.elo_engine = elo_engine or EloRatingEngine()
        self.default_rating = float(default_rating)

    @classmethod
    def normalize_status(cls, status: Any) -> str:
        return "" if status is None else str(status).strip().lower()

    @classmethod
    def is_completed_match(cls, match: Match) -> bool:
        return (
            cls.normalize_status(getattr(match, "status", None))
            in cls.COMPLETED_STATUSES
            and getattr(match, "home_score", None) is not None
            and getattr(match, "away_score", None) is not None
        )

    def load_completed_matches(self) -> list[Match]:
        statement = (
            select(Match)
            .where(
                Match.home_score.is_not(None),
                Match.away_score.is_not(None),
            )
            .order_by(
                Match.date.asc(),
                Match.id.asc(),
            )
        )

        matches = list(self.db.scalars(statement).all())

        return [
            match
            for match in matches
            if self.is_completed_match(match)
        ]

    def calculate_ratings_from_matches(
        self,
        matches: Iterable[Match],
    ) -> dict[int, float]:
        ratings: dict[int, float] = {}

        sorted_matches = sorted(
            matches,
            key=lambda match: (
                getattr(match, "date", None),
                getattr(match, "id", 0),
            ),
        )

        for match in sorted_matches:
            if not self.is_completed_match(match):
                continue

            home_team_id = int(match.home_team_id)
            away_team_id = int(match.away_team_id)

            update = self.elo_engine.update_ratings(
                home_rating=ratings.get(
                    home_team_id,
                    self.default_rating,
                ),
                away_rating=ratings.get(
                    away_team_id,
                    self.default_rating,
                ),
                home_goals=int(match.home_score),
                away_goals=int(match.away_score),
            )

            ratings[home_team_id] = float(
                update["after"]["home"]
            )
            ratings[away_team_id] = float(
                update["after"]["away"]
            )

        return {
            team_id: round(rating, 2)
            for team_id, rating in ratings.items()
        }

    def calculate_all_ratings(self) -> dict[int, float]:
        return self.calculate_ratings_from_matches(
            self.load_completed_matches()
        )

    def get_team_rating(
        self,
        team_id: int,
        ratings: dict[int, float] | None = None,
    ) -> float:
        if team_id <= 0:
            raise ValueError("team_id must be greater than zero")

        if ratings is None:
            ratings = self.calculate_all_ratings()

        return round(
            float(
                ratings.get(
                    team_id,
                    self.default_rating,
                )
            ),
            2,
        )

    def compare_teams(
        self,
        home_team_id: int,
        away_team_id: int,
        ratings: dict[int, float] | None = None,
    ) -> dict[str, Any]:
        if home_team_id <= 0:
            raise ValueError(
                "home_team_id must be greater than zero"
            )

        if away_team_id <= 0:
            raise ValueError(
                "away_team_id must be greater than zero"
            )

        if home_team_id == away_team_id:
            raise ValueError(
                "home_team_id and away_team_id must be different"
            )

        if ratings is None:
            ratings = self.calculate_all_ratings()

        home_rating = self.get_team_rating(
            team_id=home_team_id,
            ratings=ratings,
        )
        away_rating = self.get_team_rating(
            team_id=away_team_id,
            ratings=ratings,
        )

        comparison = self.elo_engine.compare_teams(
            home_rating=home_rating,
            away_rating=away_rating,
        )

        return {
            "home_team_id": home_team_id,
            "away_team_id": away_team_id,
            "home_rating": home_rating,
            "away_rating": away_rating,
            **comparison,
            "source": "database_match_history",
        }

    def build_rating_table(self) -> list[dict[str, Any]]:
        ratings = self.calculate_all_ratings()

        sorted_ratings = sorted(
            ratings.items(),
            key=lambda item: item[1],
            reverse=True,
        )

        return [
            {
                "rank": index,
                "team_id": team_id,
                "rating": round(rating, 2),
            }
            for index, (team_id, rating) in enumerate(
                sorted_ratings,
                start=1,
            )
        ]

    def update_team_from_recent_statistics(
        self,
        team_id: int,
        limit: int = 5,
    ) -> dict[str, Any]:
        if team_id <= 0:
            raise ValueError("team_id must be greater than zero")

        if limit <= 0:
            raise ValueError("limit must be greater than zero")

        ratings = self.calculate_all_ratings()

        return {
            "team_id": team_id,
            "rating": self.get_team_rating(
                team_id=team_id,
                ratings=ratings,
            ),
            "matches_used": limit,
            "status": "success",
        }