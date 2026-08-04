from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.database.models import (
    FixtureAbsence,
    FixtureLineup,
    FixtureWeather,
    Match,
    Team,
)
from app.services.sportmonks_service import (
    SportmonksAPIError,
    SportmonksService,
)


class FixtureContextSyncError(RuntimeError):
    """Raised when fixture context synchronization fails."""


class FixtureContextSyncService:
    """
    Synchronize pre-match and post-match fixture context.

    The service stores:

    - lineups and formations
    - injuries, suspensions, and other absences
    - fixture weather
    """

    def __init__(
        self,
        db: Session,
        sportmonks: SportmonksService | None = None,
    ) -> None:
        if db is None:
            raise ValueError("db session is required.")

        self.db = db
        self.sportmonks = (
            sportmonks or SportmonksService()
        )

    async def sync_match(
        self,
        match_id: int,
    ) -> dict[str, Any]:
        """
        Synchronize fixture context for one local match.
        """

        validated_match_id = self._positive_int(
            match_id,
            field_name="match_id",
        )

        match = self.db.get(
            Match,
            validated_match_id,
        )

        if match is None:
            raise FixtureContextSyncError(
                f"Local match {validated_match_id} was not found."
            )

        sportmonks_fixture_id = self._safe_int(
            match.sportmonks_id
        )

        if sportmonks_fixture_id is None:
            raise FixtureContextSyncError(
                f"Match {validated_match_id} has no SportMonks ID."
            )

        try:
            response = (
                await self.sportmonks.get_fixture_context(
                    fixture_id=sportmonks_fixture_id,
                )
            )

            fixture = (
                self.sportmonks.extract_single_data(
                    response
                )
                or {}
            )

            if not isinstance(fixture, dict):
                raise FixtureContextSyncError(
                    "SportMonks fixture context is invalid."
                )

            team_map = self._build_team_map(
                match=match,
            )

            formations = self._formation_map(
                fixture.get("formations")
            )

            lineup_result = self._sync_lineups(
                match=match,
                raw_lineups=fixture.get("lineups"),
                team_map=team_map,
                formations=formations,
            )

            absence_result = self._sync_absences(
                match=match,
                raw_absences=fixture.get("sidelined"),
                team_map=team_map,
            )

            weather_result = self._sync_weather(
                match=match,
                raw_weather=(
                    fixture.get("weatherreport")
                    or fixture.get("weatherReport")
                    or fixture.get("weather_report")
                ),
            )

            self.db.commit()

            return {
                "status": "success",
                "match_id": match.id,
                "sportmonks_fixture_id": (
                    sportmonks_fixture_id
                ),
                "fixture_name": fixture.get("name"),
                "lineups": lineup_result,
                "absences": absence_result,
                "weather": weather_result,
                "synced_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }

        except (
            FixtureContextSyncError,
            SportmonksAPIError,
            TypeError,
            ValueError,
        ):
            self.db.rollback()
            raise

        except Exception as exc:
            self.db.rollback()
            raise FixtureContextSyncError(
                "Unexpected fixture context synchronization "
                f"failure: {exc}"
            ) from exc

    def _sync_lineups(
        self,
        match: Match,
        raw_lineups: Any,
        team_map: dict[int, int],
        formations: dict[int, str],
    ) -> dict[str, int]:
        lineups = self._dict_list(raw_lineups)

        self.db.query(FixtureLineup).filter(
            FixtureLineup.fixture_id == match.id
        ).delete(
            synchronize_session=False
        )

        created = 0
        skipped = 0

        for item in lineups:
            sportmonks_lineup_id = self._safe_int(
                item.get("id")
            )
            sportmonks_team_id = self._safe_int(
                item.get("participant_id")
                or item.get("team_id")
            )
            player_id = self._safe_int(
                item.get("player_id")
            )

            local_team_id = team_map.get(
                sportmonks_team_id or -1
            )

            if (
                sportmonks_lineup_id is None
                or local_team_id is None
                or player_id is None
            ):
                skipped += 1
                continue

            player = self._dict(
                item.get("player")
            )
            position = self._dict(
                item.get("position")
            )

            player_name = self._first_text(
                item.get("player_name"),
                player.get("display_name"),
                player.get("common_name"),
                player.get("name"),
                f"Player {player_id}",
            )

            lineup_type_id = (
                self._safe_int(item.get("type_id"))
                or 0
            )

            record = FixtureLineup(
                sportmonks_lineup_id=(
                    sportmonks_lineup_id
                ),
                fixture_id=match.id,
                team_id=local_team_id,
                player_id=player_id,
                player_name=player_name,
                player_image=self._first_text(
                    player.get("image_path"),
                    player.get("image"),
                ),
                position_id=(
                    self._safe_int(
                        item.get("position_id")
                    )
                    or self._safe_int(
                        player.get("position_id")
                    )
                ),
                position_name=self._first_text(
                    position.get("name"),
                    position.get("code"),
                ),
                jersey_number=self._safe_int(
                    item.get("jersey_number")
                ),
                lineup_type_id=lineup_type_id,
                formation_field=self._first_text(
                    item.get("formation_field")
                ),
                formation_position=self._safe_int(
                    item.get("formation_position")
                ),
                formation=formations.get(
                    sportmonks_team_id or -1
                ),
                is_predicted=self._is_predicted_lineup(
                    item
                ),
                synced_at=datetime.now(
                    timezone.utc
                ),
            )

            self.db.add(record)
            created += 1

        return {
            "received": len(lineups),
            "stored": created,
            "skipped": skipped,
        }

    def _sync_absences(
        self,
        match: Match,
        raw_absences: Any,
        team_map: dict[int, int],
    ) -> dict[str, int]:
        absences = self._dict_list(raw_absences)

        self.db.query(FixtureAbsence).filter(
            FixtureAbsence.fixture_id == match.id
        ).delete(
            synchronize_session=False
        )

        created = 0
        skipped = 0

        for item in absences:
            sportmonks_absence_id = self._safe_int(
                item.get("id")
            )
            sportmonks_team_id = self._safe_int(
                item.get("participant_id")
                or item.get("team_id")
            )
            player_id = self._safe_int(
                item.get("player_id")
            )

            local_team_id = team_map.get(
                sportmonks_team_id or -1
            )

            if (
                sportmonks_absence_id is None
                or local_team_id is None
                or player_id is None
            ):
                skipped += 1
                continue

            player = self._dict(
                item.get("player")
            )
            absence_type = self._dict(
                item.get("type")
            )
            sideline = self._dict(
                item.get("sideline")
            )

            absence_name = self._first_text(
                absence_type.get("name"),
                sideline.get("name"),
                item.get("reason"),
                item.get("description"),
            )

            absence_code = self._first_text(
                absence_type.get("code"),
                sideline.get("code"),
            )

            record = FixtureAbsence(
                sportmonks_absence_id=(
                    sportmonks_absence_id
                ),
                fixture_id=match.id,
                team_id=local_team_id,
                player_id=player_id,
                player_name=self._first_text(
                    player.get("display_name"),
                    player.get("common_name"),
                    player.get("name"),
                    f"Player {player_id}",
                ),
                player_image=self._first_text(
                    player.get("image_path"),
                    player.get("image"),
                ),
                position_id=self._safe_int(
                    player.get("position_id")
                ),
                absence_type_id=self._safe_int(
                    item.get("type_id")
                ),
                absence_name=absence_name,
                absence_code=absence_code,
                absence_category=(
                    self._absence_category(
                        absence_name=absence_name,
                        absence_code=absence_code,
                    )
                ),
                synced_at=datetime.now(
                    timezone.utc
                ),
            )

            self.db.add(record)
            created += 1

        return {
            "received": len(absences),
            "stored": created,
            "skipped": skipped,
        }

    def _sync_weather(
        self,
        match: Match,
        raw_weather: Any,
    ) -> dict[str, Any]:
        weather = self._dict(raw_weather)

        self.db.query(FixtureWeather).filter(
            FixtureWeather.fixture_id == match.id
        ).delete(
            synchronize_session=False
        )

        if not weather:
            return {
                "available": False,
                "stored": 0,
            }

        temperature = self._dict(
            weather.get("temperature")
        )
        feels_like = self._dict(
            weather.get("feels_like")
            or weather.get("feelslike")
        )
        wind = self._dict(
            weather.get("wind")
        )

        record = FixtureWeather(
            fixture_id=match.id,
            sportmonks_weather_id=self._safe_int(
                weather.get("id")
            ),
            venue_id=self._safe_int(
                weather.get("venue_id")
            ),
            temperature=self._first_number(
                weather.get("temperature"),
                temperature.get("temp"),
                temperature.get("day"),
            ),
            feels_like=self._first_number(
                weather.get("feels_like"),
                weather.get("feelslike"),
                feels_like.get("day"),
                feels_like.get("temp"),
            ),
            wind_speed=self._first_number(
                weather.get("wind_speed"),
                wind.get("speed"),
            ),
            wind_direction=self._safe_int(
                weather.get("wind_direction")
                or wind.get("direction")
                or wind.get("degree")
                or wind.get("deg")
            ),
            humidity=self._first_number(
                weather.get("humidity")
            ),
            pressure=self._safe_int(
                weather.get("pressure")
            ),
            clouds=self._first_number(
                weather.get("clouds")
            ),
            description=self._first_text(
                weather.get("description"),
                weather.get("weather_description"),
            ),
            icon_url=self._first_text(
                weather.get("icon"),
                weather.get("icon_url"),
            ),
            report_type=self._first_text(
                weather.get("type")
            ),
            metric=self._first_text(
                weather.get("metric")
            ),
            synced_at=datetime.now(
                timezone.utc
            ),
        )

        self.db.add(record)

        return {
            "available": True,
            "stored": 1,
        }

    def _build_team_map(
        self,
        match: Match,
    ) -> dict[int, int]:
        local_team_ids = {
            int(match.home_team_id),
            int(match.away_team_id),
        }

        teams = (
            self.db.query(Team)
            .filter(Team.id.in_(local_team_ids))
            .all()
        )

        result: dict[int, int] = {}

        for team in teams:
            sportmonks_id = self._safe_int(
                team.sportmonks_id
            )

            if sportmonks_id is not None:
                result[sportmonks_id] = int(team.id)

        return result

    def _formation_map(
        self,
        raw_formations: Any,
    ) -> dict[int, str]:
        result: dict[int, str] = {}

        for item in self._dict_list(
            raw_formations
        ):
            team_id = self._safe_int(
                item.get("participant_id")
                or item.get("team_id")
            )

            formation = self._first_text(
                item.get("formation")
            )

            if (
                team_id is not None
                and formation is not None
            ):
                result[team_id] = formation

        return result

    @staticmethod
    def _is_predicted_lineup(
        item: dict[str, Any],
    ) -> bool:
        value = (
            item.get("is_predicted")
            or item.get("predicted")
        )

        if isinstance(value, bool):
            return value

        if isinstance(value, (int, float)):
            return bool(value)

        if isinstance(value, str):
            return value.strip().lower() in {
                "true",
                "1",
                "yes",
                "predicted",
            }

        return False

    @staticmethod
    def _absence_category(
        absence_name: str | None,
        absence_code: str | None,
    ) -> str:
        text = " ".join(
            value.lower()
            for value in (
                absence_name,
                absence_code,
            )
            if value
        )

        if any(
            keyword in text
            for keyword in (
                "suspend",
                "suspension",
                "ban",
                "card",
            )
        ):
            return "suspension"

        if any(
            keyword in text
            for keyword in (
                "doubt",
                "questionable",
                "uncertain",
            )
        ):
            return "doubtful"

        return "injury"

    @staticmethod
    def _dict(
        value: Any,
    ) -> dict[str, Any]:
        return value if isinstance(value, dict) else {}

    @classmethod
    def _dict_list(
        cls,
        value: Any,
    ) -> list[dict[str, Any]]:
        if not isinstance(value, list):
            return []

        return [
            item
            for item in value
            if isinstance(item, dict)
        ]

    @staticmethod
    def _safe_int(
        value: Any,
    ) -> int | None:
        if value is None or isinstance(value, bool):
            return None

        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _positive_int(
        value: Any,
        field_name: str,
    ) -> int:
        try:
            number = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                f"{field_name} must be an integer."
            ) from exc

        if number <= 0:
            raise ValueError(
                f"{field_name} must be positive."
            )

        return number

    @staticmethod
    def _first_text(
        *values: Any,
    ) -> str | None:
        for value in values:
            if isinstance(value, str):
                text = value.strip()

                if text:
                    return text

        return None

    @staticmethod
    def _first_number(
        *values: Any,
    ) -> float | None:
        for value in values:
            if (
                value is None
                or isinstance(value, bool)
                or isinstance(value, dict)
            ):
                continue

            if isinstance(value, str):
                normalized = value.strip()

                if normalized.endswith("%"):
                    normalized = normalized[:-1].strip()

                if not normalized:
                    continue

                value = normalized

            try:
                return float(value)
            except (TypeError, ValueError):
                continue

        return None
