from typing import Any

from app.providers.sportmonks_client import (
    SportmonksClient,
)


class TeamsProvider:
    """
    جلب الفرق من Sportmonks.
    """

    def __init__(
        self,
        client: SportmonksClient | None = None,
    ) -> None:
        self.client = (
            client
            if client is not None
            else SportmonksClient()
        )

    def get_teams_by_season(
        self,
        season_id: int,
    ) -> dict[str, Any]:
        if season_id <= 0:
            raise ValueError(
                "season_id must be greater than zero"
            )

        return self.client.get(
            endpoint=f"teams/seasons/{season_id}",
        )

    def get_simple_teams_by_season(
        self,
        season_id: int,
    ) -> list[dict[str, Any]]:
        response = self.get_teams_by_season(
            season_id
        )

        teams = response.get(
            "data",
            [],
        )

        if not isinstance(teams, list):
            return []

        simple_teams: list[dict[str, Any]] = []

        for team in teams:
            if not isinstance(team, dict):
                continue

            simple_teams.append(
                {
                    "sportmonks_id": team.get("id"),
                    "name": team.get("name"),
                    "country_id": team.get(
                        "country_id"
                    ),
                    "venue_id": team.get(
                        "venue_id"
                    ),
                    "short_code": team.get(
                        "short_code"
                    ),
                    "founded": team.get("founded"),
                    "image_path": team.get(
                        "image_path"
                    ),
                }
            )

        return simple_teams
