from typing import Any

from app.providers.sportmonks_client import (
    SportmonksClient,
)


class FixturesProvider:
    """
    جلب بيانات المباريات من Sportmonks
    وتحويلها إلى صيغة مناسبة للمشروع.
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

    @staticmethod
    def get_includes() -> str:
        """
        العلاقات المطلوبة من Sportmonks.
        """
        return (
            "participants;"
            "venue;"
            "league;"
            "season;"
            "round;"
            "stage;"
            "referees;"
            "state;"
            "scores"
        )

    def get_fixture(
        self,
        fixture_id: int,
    ) -> dict[str, Any]:
        """
        جلب مباراة واحدة بواسطة معرف Sportmonks.
        """

        if fixture_id <= 0:
            raise ValueError(
                "fixture_id must be greater than zero."
            )

        return self.client.get(
            endpoint=f"fixtures/{fixture_id}",
            params={
                "include": self.get_includes(),
            },
        )

    def get_fixtures_by_date(
        self,
        date: str,
    ) -> dict[str, Any]:
        """
        جلب مباريات يوم محدد.

        صيغة التاريخ:
        YYYY-MM-DD
        """

        if not date or len(date) != 10:
            raise ValueError(
                "date must use YYYY-MM-DD format."
            )

        return self.client.get(
            endpoint=f"fixtures/date/{date}",
            params={
                "include": self.get_includes(),
                "per_page": 50,
            },
        )

    def get_live_fixtures(
        self,
    ) -> dict[str, Any]:
        """
        جلب المباريات المباشرة.
        """

        return self.client.get(
            endpoint="livescores",
            params={
                "include": self.get_includes(),
                "per_page": 50,
            },
        )

    def get_fixtures_between(
        self,
        start_date: str,
        end_date: str,
        league_id: int,
        page: int = 1,
        per_page: int = 50,
    ) -> dict[str, Any]:
        """
        جلب مباريات دوري محدد بين تاريخين.

        يجب ألا تتجاوز الفترة 100 يوم.
        """

        if not start_date or len(start_date) != 10:
            raise ValueError(
                "start_date must use YYYY-MM-DD format."
            )

        if not end_date or len(end_date) != 10:
            raise ValueError(
                "end_date must use YYYY-MM-DD format."
            )

        if league_id <= 0:
            raise ValueError(
                "league_id must be greater than zero."
            )

        safe_page = max(1, page)

        safe_per_page = max(
            1,
            min(per_page, 50),
        )

        return self.client.get(
            endpoint=(
                f"fixtures/between/"
                f"{start_date}/{end_date}"
            ),
            params={
                "filters": (
                    f"fixtureLeagues:{league_id}"
                ),
                "include": self.get_includes(),
                "page": safe_page,
                "per_page": safe_per_page,
            },
        )

    @staticmethod
    def get_participant_location(
        participant: dict[str, Any],
    ) -> str | None:
        """
        تحديد هل الفريق صاحب الأرض أم الضيف.
        """

        meta = participant.get("meta")

        if not isinstance(meta, dict):
            return None

        location = meta.get("location")

        if location in {"home", "away"}:
            return location

        return None

    def extract_participants(
        self,
        fixture: dict[str, Any],
    ) -> dict[str, Any]:
        """
        استخراج بيانات صاحب الأرض والضيف.
        """

        result = {
            "home_team_sportmonks_id": None,
            "away_team_sportmonks_id": None,
            "home_team_name": None,
            "away_team_name": None,
        }

        participants = fixture.get(
            "participants",
            [],
        )

        if not isinstance(participants, list):
            return result

        for participant in participants:
            if not isinstance(
                participant,
                dict,
            ):
                continue

            location = (
                self.get_participant_location(
                    participant
                )
            )

            if location == "home":
                result[
                    "home_team_sportmonks_id"
                ] = participant.get("id")

                result[
                    "home_team_name"
                ] = participant.get("name")

            elif location == "away":
                result[
                    "away_team_sportmonks_id"
                ] = participant.get("id")

                result[
                    "away_team_name"
                ] = participant.get("name")

        return result

    @staticmethod
    def extract_score_value(
        score_item: dict[str, Any],
    ) -> int | None:
        """
        استخراج عدد الأهداف من عنصر النتيجة.
        """

        score = score_item.get("score")

        if isinstance(score, dict):
            goals = score.get("goals")

            if goals is not None:
                try:
                    return int(goals)
                except (TypeError, ValueError):
                    return None

        goals = score_item.get("goals")

        if goals is not None:
            try:
                return int(goals)
            except (TypeError, ValueError):
                return None

        return None

    def extract_scores(
        self,
        fixture: dict[str, Any],
        home_team_id: int | None,
        away_team_id: int | None,
    ) -> tuple[int | None, int | None]:
        """
        استخراج نتيجة صاحب الأرض والضيف.
        """

        home_score: int | None = None
        away_score: int | None = None

        scores = fixture.get(
            "scores",
            [],
        )

        if not isinstance(scores, list):
            return home_score, away_score

        for score_item in scores:
            if not isinstance(
                score_item,
                dict,
            ):
                continue

            participant_id = score_item.get(
                "participant_id"
            )

            score_value = (
                self.extract_score_value(
                    score_item
                )
            )

            if score_value is None:
                continue

            if participant_id == home_team_id:
                home_score = score_value

            elif participant_id == away_team_id:
                away_score = score_value

        return home_score, away_score

    @staticmethod
    def extract_status(
        fixture: dict[str, Any],
    ) -> str:
        """
        تحويل حالة Sportmonks إلى الحالة
        المستخدمة داخل المشروع.
        """

        state = fixture.get("state")

        state_name = ""

        if isinstance(state, dict):
            state_name = str(
                state.get("developer_name")
                or state.get("short_name")
                or state.get("name")
                or ""
            ).upper()

        finished_values = {
            "FT",
            "AET",
            "FT_PEN",
            "FINISHED",
            "FULLTIME",
            "FULL_TIME",
        }

        live_values = {
            "INPLAY",
            "LIVE",
            "1ST_HALF",
            "2ND_HALF",
            "HT",
            "BREAK",
            "EXTRA_TIME",
            "PENALTIES",
        }

        cancelled_values = {
            "CANCELLED",
            "CANCELED",
            "POSTPONED",
            "ABANDONED",
            "SUSPENDED",
        }

        if state_name in finished_values:
            return "finished"

        if state_name in live_values:
            return "live"

        if state_name in cancelled_values:
            return "cancelled"

        return "scheduled"

    def get_simple_fixture(
        self,
        fixture: dict[str, Any],
    ) -> dict[str, Any]:
        """
        تحويل المباراة إلى صيغة مبسطة
        مناسبة للحفظ في قاعدة البيانات.
        """

        participants = (
            self.extract_participants(
                fixture
            )
        )

        home_team_id = participants[
            "home_team_sportmonks_id"
        ]

        away_team_id = participants[
            "away_team_sportmonks_id"
        ]

        home_score, away_score = (
            self.extract_scores(
                fixture=fixture,
                home_team_id=home_team_id,
                away_team_id=away_team_id,
            )
        )

        return {
            "sportmonks_id": fixture.get("id"),

            "home_team_sportmonks_id": (
                home_team_id
            ),

            "away_team_sportmonks_id": (
                away_team_id
            ),

            "home_team_name": participants[
                "home_team_name"
            ],

            "away_team_name": participants[
                "away_team_name"
            ],

            "date": fixture.get(
                "starting_at"
            ),

            "status": self.extract_status(
                fixture
            ),

            "home_score": home_score,

            "away_score": away_score,

            "state_id": fixture.get(
                "state_id"
            ),

            "league_id": fixture.get(
                "league_id"
            ),

            "season_id": fixture.get(
                "season_id"
            ),

            "venue_id": fixture.get(
                "venue_id"
            ),
        }

    def get_simple_fixtures_between(
        self,
        start_date: str,
        end_date: str,
        league_id: int,
        page: int = 1,
        per_page: int = 50,
    ) -> list[dict[str, Any]]:
        """
        جلب المباريات بين تاريخين
        وتحويلها إلى الصيغة المبسطة.
        """

        response = self.get_fixtures_between(
            start_date=start_date,
            end_date=end_date,
            league_id=league_id,
            page=page,
            per_page=per_page,
        )

        fixtures = response.get(
            "data",
            [],
        )

        if not isinstance(fixtures, list):
            return []

        return [
            self.get_simple_fixture(
                fixture
            )
            for fixture in fixtures
            if isinstance(
                fixture,
                dict,
            )
        ]