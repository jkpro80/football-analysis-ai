from __future__ import annotations

from collections import Counter
from typing import Any

from sqlalchemy.orm import Session

from app.database.models import (
    FixtureAbsence,
    FixtureLineup,
    FixtureWeather,
    Match,
    Team,
)


class FixtureContextAnalysisError(RuntimeError):
    """Raised when fixture context analysis cannot be completed."""


class FixtureContextAnalyzer:
    """
    Analyze stored fixture lineups, absences, and weather.

    This service does not modify prediction values directly.
    It produces normalized, explainable context features that
    can later be consumed by Feature Engineering.
    """

    STARTER_TYPE_ID = 11
    SUBSTITUTE_TYPE_ID = 12

    MAX_AVAILABILITY_PENALTY = 0.12
    MAX_WEATHER_PENALTY = 0.08

    POSITION_WEIGHTS = {
        "goalkeeper": 1.25,
        "defender": 1.00,
        "midfielder": 1.05,
        "attacker": 1.10,
        "unknown": 0.85,
    }

    CATEGORY_WEIGHTS = {
        "suspension": 1.10,
        "injury": 1.00,
        "doubtful": 0.50,
        "unknown": 0.75,
    }

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
        """
        Analyze context for one local fixture ID.
        """

        validated_fixture_id = self._positive_int(
            fixture_id,
            field_name="fixture_id",
        )

        match = self.db.get(
            Match,
            validated_fixture_id,
        )

        if match is None:
            raise FixtureContextAnalysisError(
                f"Fixture {validated_fixture_id} was not found."
            )

        teams = self._load_teams(match)

        lineups = (
            self.db.query(FixtureLineup)
            .filter(
                FixtureLineup.fixture_id
                == validated_fixture_id
            )
            .all()
        )

        absences = (
            self.db.query(FixtureAbsence)
            .filter(
                FixtureAbsence.fixture_id
                == validated_fixture_id
            )
            .all()
        )

        weather = (
            self.db.query(FixtureWeather)
            .filter(
                FixtureWeather.fixture_id
                == validated_fixture_id
            )
            .one_or_none()
        )

        home_team_id = int(match.home_team_id)
        away_team_id = int(match.away_team_id)

        home = self._analyze_team(
            team_id=home_team_id,
            team=teams.get(home_team_id),
            lineups=lineups,
            absences=absences,
        )

        away = self._analyze_team(
            team_id=away_team_id,
            team=teams.get(away_team_id),
            lineups=lineups,
            absences=absences,
        )

        weather_analysis = self._analyze_weather(
            weather
        )

        warnings = self._build_warnings(
            home=home,
            away=away,
            weather=weather_analysis,
        )

        return {
            "fixture_id": validated_fixture_id,
            "home": home,
            "away": away,
            "weather": weather_analysis,
            "features": {
                "home_availability_factor": (
                    home["availability_factor"]
                ),
                "away_availability_factor": (
                    away["availability_factor"]
                ),
                "home_absence_penalty": (
                    home["absence_penalty"]
                ),
                "away_absence_penalty": (
                    away["absence_penalty"]
                ),
                "weather_attack_factor": (
                    weather_analysis[
                        "attack_factor"
                    ]
                ),
                "weather_fatigue_factor": (
                    weather_analysis[
                        "fatigue_factor"
                    ]
                ),
                "weather_severity": (
                    weather_analysis["severity"]
                ),
            },
            "warnings": warnings,
        }

    def _load_teams(
        self,
        match: Match,
    ) -> dict[int, Team]:
        team_ids = {
            int(match.home_team_id),
            int(match.away_team_id),
        }

        teams = (
            self.db.query(Team)
            .filter(Team.id.in_(team_ids))
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
        lineups: list[FixtureLineup],
        absences: list[FixtureAbsence],
    ) -> dict[str, Any]:
        team_lineups = [
            item
            for item in lineups
            if int(item.team_id) == team_id
        ]

        team_absences = [
            item
            for item in absences
            if int(item.team_id) == team_id
        ]

        starters = [
            item
            for item in team_lineups
            if int(item.lineup_type_id)
            == self.STARTER_TYPE_ID
        ]

        substitutes = [
            item
            for item in team_lineups
            if int(item.lineup_type_id)
            == self.SUBSTITUTE_TYPE_ID
        ]

        predicted_count = sum(
            1
            for item in team_lineups
            if bool(item.is_predicted)
        )

        formation = next(
            (
                item.formation
                for item in starters
                if item.formation
            ),
            None,
        )

        position_counts = Counter(
            self._normalize_position(
                item.position_name
            )
            for item in starters
        )

        absence_categories = Counter(
            self._normalize_category(
                item.absence_category
            )
            for item in team_absences
        )

        absence_positions = Counter(
            self._infer_absence_position(
                absence=item,
                lineups=team_lineups,
            )
            for item in team_absences
        )

        raw_penalty = sum(
            self._absence_weight(
                absence=item,
                lineups=team_lineups,
            )
            for item in team_absences
        )

        absence_penalty = min(
            self.MAX_AVAILABILITY_PENALTY,
            raw_penalty,
        )

        availability_factor = max(
            1.0 - self.MAX_AVAILABILITY_PENALTY,
            1.0 - absence_penalty,
        )

        lineup_complete = len(starters) == 11

        return {
            "team_id": team_id,
            "team_name": (
                getattr(team, "name", None)
                or f"Team {team_id}"
            ),
            "formation": formation,
            "starter_count": len(starters),
            "substitute_count": len(substitutes),
            "predicted_count": predicted_count,
            "lineup_complete": lineup_complete,
            "starter_positions": dict(
                position_counts
            ),
            "absence_count": len(team_absences),
            "absence_categories": dict(
                absence_categories
            ),
            "absence_positions": dict(
                absence_positions
            ),
            "absence_penalty": round(
                absence_penalty,
                4,
            ),
            "availability_factor": round(
                availability_factor,
                4,
            ),
        }

    def _absence_weight(
        self,
        *,
        absence: FixtureAbsence,
        lineups: list[FixtureLineup],
    ) -> float:
        position = self._infer_absence_position(
            absence=absence,
            lineups=lineups,
        )

        category = self._normalize_category(
            absence.absence_category
        )

        position_weight = self.POSITION_WEIGHTS.get(
            position,
            self.POSITION_WEIGHTS["unknown"],
        )

        category_weight = self.CATEGORY_WEIGHTS.get(
            category,
            self.CATEGORY_WEIGHTS["unknown"],
        )

        base_penalty = 0.012

        return (
            base_penalty
            * position_weight
            * category_weight
        )

    def _infer_absence_position(
        self,
        *,
        absence: FixtureAbsence,
        lineups: list[FixtureLineup],
    ) -> str:
        if absence.position_id is not None:
            mapped = self._position_from_id(
                int(absence.position_id)
            )

            if mapped != "unknown":
                return mapped

        matching_lineup = next(
            (
                item
                for item in lineups
                if int(item.player_id)
                == int(absence.player_id)
            ),
            None,
        )

        if matching_lineup is not None:
            return self._normalize_position(
                matching_lineup.position_name
            )

        return "unknown"

    def _analyze_weather(
        self,
        weather: FixtureWeather | None,
    ) -> dict[str, Any]:
        if weather is None:
            return {
                "available": False,
                "temperature": None,
                "feels_like": None,
                "wind_speed": None,
                "humidity": None,
                "description": None,
                "is_rain": False,
                "is_extreme_heat": False,
                "is_extreme_cold": False,
                "severity": 0.0,
                "attack_factor": 1.0,
                "fatigue_factor": 1.0,
            }

        temperature = self._number(
            weather.temperature
        )
        feels_like = self._number(
            weather.feels_like,
            default=temperature,
        )
        wind_speed = self._number(
            weather.wind_speed
        )
        humidity = self._number(
            weather.humidity
        )

        description = (
            str(weather.description or "")
            .strip()
            .lower()
        )

        is_rain = any(
            keyword in description
            for keyword in (
                "rain",
                "drizzle",
                "storm",
                "shower",
            )
        )

        is_extreme_heat = (
            temperature is not None
            and temperature >= 32.0
        )

        is_extreme_cold = (
            temperature is not None
            and temperature <= 0.0
        )

        severity = 0.0

        if is_rain:
            severity += 0.02

        if wind_speed is not None:
            if wind_speed >= 12.0:
                severity += 0.035
            elif wind_speed >= 8.0:
                severity += 0.02
            elif wind_speed >= 5.0:
                severity += 0.01

        if is_extreme_heat:
            severity += 0.03

        if is_extreme_cold:
            severity += 0.02

        if humidity is not None and humidity >= 85.0:
            severity += 0.01

        severity = min(
            self.MAX_WEATHER_PENALTY,
            severity,
        )

        attack_factor = max(
            1.0 - self.MAX_WEATHER_PENALTY,
            1.0 - severity,
        )

        fatigue_severity = 0.0

        if is_extreme_heat:
            fatigue_severity += 0.04

        if humidity is not None and humidity >= 80.0:
            fatigue_severity += 0.015

        fatigue_factor = max(
            0.92,
            1.0 - min(
                0.08,
                fatigue_severity,
            ),
        )

        return {
            "available": True,
            "temperature": temperature,
            "feels_like": feels_like,
            "wind_speed": wind_speed,
            "wind_direction": weather.wind_direction,
            "humidity": humidity,
            "pressure": weather.pressure,
            "clouds": self._number(
                weather.clouds
            ),
            "description": weather.description,
            "is_rain": is_rain,
            "is_extreme_heat": is_extreme_heat,
            "is_extreme_cold": is_extreme_cold,
            "severity": round(severity, 4),
            "attack_factor": round(
                attack_factor,
                4,
            ),
            "fatigue_factor": round(
                fatigue_factor,
                4,
            ),
        }

    @staticmethod
    def _build_warnings(
        *,
        home: dict[str, Any],
        away: dict[str, Any],
        weather: dict[str, Any],
    ) -> list[str]:
        warnings: list[str] = []

        if not home["lineup_complete"]:
            warnings.append(
                "Home starting lineup is incomplete."
            )

        if not away["lineup_complete"]:
            warnings.append(
                "Away starting lineup is incomplete."
            )

        if not weather["available"]:
            warnings.append(
                "Fixture weather is unavailable."
            )

        return warnings

    @staticmethod
    def _normalize_position(
        value: Any,
    ) -> str:
        text = str(value or "").strip().lower()

        if "goalkeeper" in text or text == "gk":
            return "goalkeeper"

        if "defender" in text or text in {
            "defence",
            "defense",
            "df",
        }:
            return "defender"

        if "midfielder" in text or text in {
            "midfield",
            "mf",
        }:
            return "midfielder"

        if "attacker" in text or text in {
            "forward",
            "striker",
            "fw",
        }:
            return "attacker"

        return "unknown"

    @staticmethod
    def _position_from_id(
        position_id: int,
    ) -> str:
        mapping = {
            24: "goalkeeper",
            25: "defender",
            26: "midfielder",
            27: "attacker",
        }

        return mapping.get(
            position_id,
            "unknown",
        )

    @staticmethod
    def _normalize_category(
        value: Any,
    ) -> str:
        text = str(value or "").strip().lower()

        if text in {
            "injury",
            "suspension",
            "doubtful",
        }:
            return text

        return "unknown"

    @staticmethod
    def _number(
        value: Any,
        default: float | None = None,
    ) -> float | None:
        if value is None or isinstance(value, bool):
            return default

        try:
            return float(value)
        except (TypeError, ValueError):
            return default

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
