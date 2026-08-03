from __future__ import annotations

import os
from datetime import date
from typing import Any

import httpx
from dotenv import load_dotenv

from app.data.providers.base import FootballDataProvider
from app.data.schemas.football import (
    CompetitionData,
    MatchData,
    MatchScoreData,
    MatchTeamData,
    StandingRowData,
    TeamData,
)

load_dotenv()


class FootballDataAPIError(RuntimeError):
    """خطأ صادر من مزود football-data.org."""


class FootballDataOrgProvider(FootballDataProvider):
    BASE_URL = "https://api.football-data.org/v4"

    def __init__(
        self,
        api_key: str | None = None,
        timeout_seconds: float = 20.0,
    ) -> None:
        self.api_key = api_key or os.getenv("FOOTBALL_DATA_API_KEY")

        if not self.api_key:
            raise ValueError(
                "FOOTBALL_DATA_API_KEY is missing. "
                "Add it to the backend .env file."
            )

        self.client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            timeout=httpx.Timeout(timeout_seconds),
            headers={
                "X-Auth-Token": self.api_key,
                "Accept": "application/json",
            },
        )

    async def _request(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        try:
            response = await self.client.get(endpoint, params=params)
            response.raise_for_status()
        except httpx.TimeoutException as exc:
            raise FootballDataAPIError(
                "Football data provider request timed out."
            ) from exc
        except httpx.HTTPStatusError as exc:
            status_code = exc.response.status_code

            try:
                details = exc.response.json()
            except ValueError:
                details = exc.response.text

            raise FootballDataAPIError(
                f"Provider returned HTTP {status_code}: {details}"
            ) from exc
        except httpx.RequestError as exc:
            raise FootballDataAPIError(
                f"Could not connect to football data provider: {exc}"
            ) from exc

        try:
            return response.json()
        except ValueError as exc:
            raise FootballDataAPIError(
                "Provider returned an invalid JSON response."
            ) from exc

    async def get_competitions(self) -> list[CompetitionData]:
        payload = await self._request("/competitions")

        competitions: list[CompetitionData] = []

        for item in payload.get("competitions", []):
            area = item.get("area") or {}

            competitions.append(
                CompetitionData(
                    external_id=item["id"],
                    name=item["name"],
                    code=item.get("code"),
                    country=area.get("name"),
                    emblem=item.get("emblem"),
                )
            )

        return competitions

    async def get_matches(
        self,
        date_from: date | None = None,
        date_to: date | None = None,
        competition_code: str | None = None,
        status: str | None = None,
    ) -> list[MatchData]:
        params: dict[str, Any] = {}

        if date_from:
            params["dateFrom"] = date_from.isoformat()

        if date_to:
            params["dateTo"] = date_to.isoformat()

        if status:
            params["status"] = status.upper()

        endpoint = (
            f"/competitions/{competition_code}/matches"
            if competition_code
            else "/matches"
        )

        payload = await self._request(endpoint, params=params)
        return [
            self._map_match(item)
            for item in payload.get("matches", [])
        ]

    async def get_teams(
        self,
        competition_code: str,
        season: int | None = None,
    ) -> list[TeamData]:
        params = {"season": season} if season else None

        payload = await self._request(
            f"/competitions/{competition_code}/teams",
            params=params,
        )

        competition_area = (payload.get("competition") or {}).get("area") or {}
        default_country = competition_area.get("name")

        return [
            TeamData(
                external_id=item["id"],
                name=item["name"],
                short_name=item.get("shortName"),
                tla=item.get("tla"),
                country=(
                    (item.get("area") or {}).get("name")
                    or default_country
                ),
                crest=item.get("crest"),
            )
            for item in payload.get("teams", [])
        ]

    async def get_standings(
        self,
        competition_code: str,
        season: int | None = None,
    ) -> list[StandingRowData]:
        params = {"season": season} if season else None

        payload = await self._request(
            f"/competitions/{competition_code}/standings",
            params=params,
        )

        rows: list[StandingRowData] = []

        for standing in payload.get("standings", []):
            if standing.get("type") != "TOTAL":
                continue

            for item in standing.get("table", []):
                team = item.get("team") or {}

                rows.append(
                    StandingRowData(
                        position=item["position"],
                        team=TeamData(
                            external_id=team["id"],
                            name=team["name"],
                            short_name=team.get("shortName"),
                            tla=team.get("tla"),
                            crest=team.get("crest"),
                        ),
                        played_games=item.get("playedGames", 0),
                        won=item.get("won", 0),
                        draw=item.get("draw", 0),
                        lost=item.get("lost", 0),
                        goals_for=item.get("goalsFor", 0),
                        goals_against=item.get("goalsAgainst", 0),
                        goal_difference=item.get("goalDifference", 0),
                        points=item.get("points", 0),
                    )
                )

        return rows

    @staticmethod
    def _map_team(team: dict[str, Any]) -> MatchTeamData:
        return MatchTeamData(
            external_id=team.get("id"),
            name=team.get("name") or "Unknown Team",
            short_name=team.get("shortName"),
            tla=team.get("tla"),
            crest=team.get("crest"),
        )

    @classmethod
    def _map_match(cls, item: dict[str, Any]) -> MatchData:
        competition = item.get("competition") or {}
        season = item.get("season") or {}
        score = item.get("score") or {}
        full_time = score.get("fullTime") or {}
        half_time = score.get("halfTime") or {}

        start_date = season.get("startDate")
        season_start_year = (
            int(start_date[:4])
            if isinstance(start_date, str) and len(start_date) >= 4
            else None
        )

        known_statuses = {
            "SCHEDULED",
            "TIMED",
            "IN_PLAY",
            "PAUSED",
            "FINISHED",
            "POSTPONED",
            "SUSPENDED",
            "CANCELLED",
        }

        provider_status = item.get("status", "UNKNOWN")
        normalized_status = (
            provider_status
            if provider_status in known_statuses
            else "UNKNOWN"
        )

        return MatchData(
            external_id=item["id"],
            competition_id=competition.get("id"),
            competition_name=competition.get("name"),
            season_start_year=season_start_year,
            utc_date=item["utcDate"],
            status=normalized_status,
            matchday=item.get("matchday"),
            stage=item.get("stage"),
            home_team=cls._map_team(item.get("homeTeam") or {}),
            away_team=cls._map_team(item.get("awayTeam") or {}),
            full_time=MatchScoreData(
                home=full_time.get("home"),
                away=full_time.get("away"),
            ),
            half_time=MatchScoreData(
                home=half_time.get("home"),
                away=half_time.get("away"),
            ),
        )

    async def close(self) -> None:
        await self.client.aclose()