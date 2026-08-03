from datetime import datetime, timezone
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.database.models import Match, MatchStatistic, Team
from app.providers.statistics_provider import StatisticsProvider
from app.services.team_rating_service import TeamRatingService
from app.services.team_statistics_service import TeamStatisticsService


class StatisticsSyncService:
    """
    مزامنة إحصائيات المباريات من Sportmonks
    مع جدول match_statistics، ثم تحديث
    تقييمات الفريقين تلقائيًا.
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self.provider = StatisticsProvider()
        self.team_rating_service = TeamRatingService(db)
        self.team_statistics_service = TeamStatisticsService(db)

    def get_match_by_sportmonks_id(self, sportmonks_id: int) -> Match | None:
        statement = select(Match).where(Match.sportmonks_id == sportmonks_id)
        return self.db.scalar(statement)

    def get_team_by_sportmonks_id(self, sportmonks_id: int) -> Team | None:
        statement = select(Team).where(Team.sportmonks_id == sportmonks_id)
        return self.db.scalar(statement)

    def get_existing_statistic(
        self,
        fixture_id: int,
        team_id: int,
    ) -> MatchStatistic | None:
        statement = select(MatchStatistic).where(
            MatchStatistic.fixture_id == fixture_id,
            MatchStatistic.team_id == team_id,
        )
        return self.db.scalar(statement)

    @staticmethod
    def get_value(data: dict[str, Any], *keys: str) -> float | None:
        for key in keys:
            value = data.get(key)
            if value is None:
                continue

            if isinstance(value, str):
                value = value.replace("%", "").replace(",", ".").strip()

            try:
                return float(value)
            except (TypeError, ValueError):
                continue

        return None

    @classmethod
    def has_useful_statistics(cls, statistics: dict[str, Any]) -> bool:
        if not statistics:
            return False

        supported_keys = (
            "ball_possession",
            "ball_possession_percentage",
            "possession",
            "corners",
            "goals",
            "assists",
            "yellowcards",
            "yellow_cards",
            "redcards",
            "red_cards",
            "successful_dribbles_percentage",
            "shots",
            "shots_total",
            "total_shots",
            "shots_on_target",
            "shots_ongoal",
            "shots_on_goal",
            "expected_goals",
            "expected_goals_xg",
            "xg",
            "expected_goals_against",
            "xga",
        )

        return any(
            cls.get_value(statistics, key) is not None
            for key in supported_keys
        )

    def save_team_statistics(
        self,
        match: Match,
        team: Team,
        statistics: dict[str, Any],
    ) -> str:
        record = self.get_existing_statistic(
            fixture_id=match.id,
            team_id=team.id,
        )

        created = record is None

        if record is None:
            record = MatchStatistic(
                fixture_id=match.id,
                team_id=team.id,
            )
            self.db.add(record)

        record.possession = self.get_value(
            statistics,
            "ball_possession",
            "ball_possession_percentage",
            "possession",
        )
        record.corners = self.get_value(statistics, "corners")
        record.goals = self.get_value(statistics, "goals")
        record.yellow_cards = self.get_value(
            statistics,
            "yellowcards",
            "yellow_cards",
        )
        record.red_cards = self.get_value(
            statistics,
            "redcards",
            "red_cards",
        )

        record.assists = self.get_value(
            statistics,
            "assists",
        )

        record.successful_dribbles_percentage = self.get_value(
            statistics,
            "successful_dribbles_percentage",
        )

        record.raw_statistics = dict(statistics)
        record.updated_at = datetime.now(timezone.utc)

        return "created" if created else "updated"

    def sync_fixture_statistics(
        self,
        fixture_sportmonks_id: int,
    ) -> dict[str, Any]:
        match = self.get_match_by_sportmonks_id(fixture_sportmonks_id)

        if match is None:
            raise ValueError("Fixture is not present in the local database.")

        response = self.provider.get_simple_fixture_statistics(
            fixture_sportmonks_id
        )

        if response is None:
            return {
                "fixture_sportmonks_id": fixture_sportmonks_id,
                "local_match_id": match.id,
                "created": 0,
                "updated": 0,
                "skipped": True,
                "reason": "Sportmonks returned no fixture statistics.",
                "statistics_count": 0,
                "mapped_statistics_count": 0,
                "home_statistics_available": False,
                "away_statistics_available": False,
                "home_statistics": {},
                "away_statistics": {},
                "home_team_rating": None,
                "away_team_rating": None,
            }

        if not isinstance(response, dict):
            return {
                "fixture_sportmonks_id": fixture_sportmonks_id,
                "local_match_id": match.id,
                "created": 0,
                "updated": 0,
                "skipped": True,
                "reason": "Sportmonks returned an invalid statistics response.",
                "statistics_count": 0,
                "mapped_statistics_count": 0,
                "home_statistics_available": False,
                "away_statistics_available": False,
                "home_statistics": {},
                "away_statistics": {},
                "home_team_rating": None,
                "away_team_rating": None,
            }

        home_data = response.get("home") or {}
        away_data = response.get("away") or {}

        if not isinstance(home_data, dict):
            home_data = {}
        if not isinstance(away_data, dict):
            away_data = {}

        statistics_count = int(response.get("statistics_count", 0) or 0)
        mapped_statistics_count = int(
            response.get("mapped_statistics_count", 0) or 0
        )

        home_has_statistics = self.has_useful_statistics(home_data)
        away_has_statistics = self.has_useful_statistics(away_data)

        home_team = self.db.get(Team, match.home_team_id)
        away_team = self.db.get(Team, match.away_team_id)

        if home_team is None or away_team is None:
            raise ValueError("Local team data was not found.")

        if not home_has_statistics and not away_has_statistics:
            return {
                "fixture_sportmonks_id": fixture_sportmonks_id,
                "local_match_id": match.id,
                "created": 0,
                "updated": 0,
                "skipped": True,
                "reason": "No usable fixture statistics were returned by Sportmonks.",
                "statistics_count": statistics_count,
                "mapped_statistics_count": mapped_statistics_count,
                "home_statistics_available": False,
                "away_statistics_available": False,
                "home_statistics": {},
                "away_statistics": {},
                "home_team_rating": None,
                "away_team_rating": None,
            }

        created = 0
        updated = 0
        home_result: str | None = None
        away_result: str | None = None
        home_statistics_update: dict[str, Any] | None = None
        away_statistics_update: dict[str, Any] | None = None
        home_rating: dict[str, Any] | None = None
        away_rating: dict[str, Any] | None = None

        try:
            if home_has_statistics:
                home_result = self.save_team_statistics(
                    match=match,
                    team=home_team,
                    statistics=home_data,
                )

            if away_has_statistics:
                away_result = self.save_team_statistics(
                    match=match,
                    team=away_team,
                    statistics=away_data,
                )

            for result in (home_result, away_result):
                if result == "created":
                    created += 1
                elif result == "updated":
                    updated += 1

            if home_has_statistics:
                home_statistics_update = (
                    self.team_statistics_service.update_team_from_recent_matches(
                        team_id=home_team.id,
                        limit=10,
                    )
                )

                home_rating = (
                    self.team_rating_service.update_team_from_recent_statistics(
                        team_id=home_team.id,
                        limit=5,
                    )
                )

            if away_has_statistics:
                away_statistics_update = (
                    self.team_statistics_service.update_team_from_recent_matches(
                        team_id=away_team.id,
                        limit=10,
                    )
                )

                away_rating = (
                    self.team_rating_service.update_team_from_recent_statistics(
                        team_id=away_team.id,
                        limit=5,
                    )
                )

            self.db.commit()

        except Exception:
            self.db.rollback()
            raise

        return {
            "fixture_sportmonks_id": fixture_sportmonks_id,
            "local_match_id": match.id,
            "created": created,
            "updated": updated,
            "skipped": False,
            "statistics_count": statistics_count,
            "mapped_statistics_count": mapped_statistics_count,
            "home_statistics_available": home_has_statistics,
            "away_statistics_available": away_has_statistics,
            "home_statistics": home_data,
            "away_statistics": away_data,
            "home_team_update": home_statistics_update,
            "away_team_update": away_statistics_update,
            "home_team_rating": home_rating,
            "away_team_rating": away_rating,
        }

    def sync_team_statistics(
        self,
        sportmonks_team_id: int,
        limit: int = 20,
    ) -> dict[str, Any]:
        team = self.get_team_by_sportmonks_id(sportmonks_team_id)

        if team is None:
            raise ValueError("Team is not present in the local database.")

        safe_limit = max(1, min(limit, 100))

        statement = (
            select(Match)
            .where(
                or_(
                    Match.home_team_id == team.id,
                    Match.away_team_id == team.id,
                ),
                Match.sportmonks_id.is_not(None),
            )
            .order_by(Match.date.desc(), Match.id.desc())
            .limit(safe_limit)
        )

        matches = list(self.db.scalars(statement).all())

        synced = 0
        skipped = 0
        failed = 0
        created_rows = 0
        updated_rows = 0
        results: list[dict[str, Any]] = []

        for match in matches:
            if match.sportmonks_id is None:
                continue

            try:
                result = self.sync_fixture_statistics(
                    fixture_sportmonks_id=int(match.sportmonks_id)
                )
                results.append(result)

                created_rows += int(result.get("created", 0) or 0)
                updated_rows += int(result.get("updated", 0) or 0)

                if result.get("skipped"):
                    skipped += 1
                else:
                    synced += 1

            except Exception as error:
                self.db.rollback()
                failed += 1
                results.append(
                    {
                        "fixture_sportmonks_id": match.sportmonks_id,
                        "local_match_id": match.id,
                        "success": False,
                        "error": f"{type(error).__name__}: {error}",
                    }
                )

        return {
            "status": "success" if failed == 0 else "completed_with_errors",
            "team": {
                "id": team.id,
                "sportmonks_id": team.sportmonks_id,
                "name": team.name,
            },
            "requested_limit": safe_limit,
            "matches_found": len(matches),
            "synced_fixtures": synced,
            "skipped_fixtures": skipped,
            "failed_fixtures": failed,
            "created_statistic_rows": created_rows,
            "updated_statistic_rows": updated_rows,
            "results": results,
        }
