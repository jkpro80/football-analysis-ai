from typing import Any

from app.providers.sportmonks_client import (
    SportmonksClient,
)


class StandingsProvider:
    """
    جلب جداول الترتيب من Sportmonks.
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

    def get_all_standings(
        self,
        page: int = 1,
        per_page: int = 25,
    ) -> dict[str, Any]:
        """
        جلب جميع سجلات الترتيب المتاحة
        ضمن اشتراك Sportmonks.
        """

        safe_page = max(1, page)

        safe_per_page = max(
            1,
            min(per_page, 50),
        )

        return self.client.get(
            endpoint="standings",
            params={
                "page": safe_page,
                "per_page": safe_per_page,
                "include": (
                    "participant;"
                    "league;"
                    "season;"
                    "stage;"
                    "group;"
                    "round;"
                    "details;"
                    "form"
                ),
            },
        )

    def get_standings_by_season(
        self,
        season_id: int,
    ) -> dict[str, Any]:
        """
        جلب جدول الترتيب الكامل لموسم محدد.
        """

        if season_id <= 0:
            raise ValueError(
                "season_id must be greater than 0"
            )

        return self.client.get(
            endpoint=(
                f"standings/seasons/"
                f"{season_id}"
            ),
            params={
                "include": (
                    "participant;"
                    "league;"
                    "season;"
                    "stage;"
                    "group;"
                    "round;"
                    "details;"
                    "form"
                ),
            },
        )

    def get_simple_table_by_season(
        self,
        season_id: int,
    ) -> list[dict[str, Any]]:
        """
        إرجاع نسخة مبسطة من جدول الموسم.
        """

        response = (
            self.get_standings_by_season(
                season_id
            )
        )

        standings = response.get(
            "data",
            [],
        )

        if not isinstance(standings, list):
            return []

        table: list[dict[str, Any]] = []

        for standing in standings:
            if not isinstance(
                standing,
                dict,
            ):
                continue

            participant = standing.get(
                "participant"
            )

            team_name = None

            if isinstance(
                participant,
                dict,
            ):
                team_name = (
                    participant.get("name")
                )

            table.append(
                {
                    "standing_id": (
                        standing.get("id")
                    ),
                    "position": (
                        standing.get("position")
                    ),
                    "participant_id": (
                        standing.get(
                            "participant_id"
                        )
                    ),
                    "team_name": team_name,
                    "league_id": (
                        standing.get("league_id")
                    ),
                    "season_id": (
                        standing.get("season_id")
                    ),
                    "stage_id": (
                        standing.get("stage_id")
                    ),
                    "group_id": (
                        standing.get("group_id")
                    ),
                    "round_id": (
                        standing.get("round_id")
                    ),
                    "points": (
                        standing.get("points")
                    ),
                    "movement": (
                        standing.get("result")
                    ),
                    "form": standing.get(
                        "form"
                    ),
                    "details": standing.get(
                        "details",
                        [],
                    ),
                }
            )

        table.sort(
            key=lambda item: (
                item["position"]
                if isinstance(
                    item["position"],
                    int,
                )
                else 9999
            )
        )

        return table