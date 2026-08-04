import os
from datetime import date
from typing import Any

import httpx
from dotenv import load_dotenv


load_dotenv()


class SportmonksAPIError(Exception):
    """
    خطأ مخصص للمشكلات القادمة من Sportmonks API.
    """


class SportmonksService:
    """
    خدمة مركزية للتعامل مع Sportmonks Football API v3.
    """

    def __init__(
        self,
        api_token: str | None = None,
        base_url: str | None = None,
        timeout_seconds: float = 30.0,
    ) -> None:
        self.api_token = (
            api_token
            or os.getenv("SPORTMONKS_API_TOKEN")
        )

        self.base_url = (
            base_url
            or os.getenv(
                "SPORTMONKS_BASE_URL",
                "https://api.sportmonks.com/v3/football",
            )
        ).rstrip("/")

        self.timeout = httpx.Timeout(
            timeout_seconds
        )

        if not self.api_token:
            raise SportmonksAPIError(
                "SPORTMONKS_API_TOKEN is not configured."
            )

    async def _request(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        تنفيذ طلب GET إلى Sportmonks
        وإرجاع استجابة JSON.
        """

        request_params: dict[str, Any] = {
            "api_token": self.api_token,
        }

        if params:
            request_params.update(params)

        url = (
            f"{self.base_url}/"
            f"{endpoint.lstrip('/')}"
        )

        try:
            async with httpx.AsyncClient(
                timeout=self.timeout,
            ) as client:
                response = await client.get(
                    url,
                    params=request_params,
                    headers={
                        "Accept": "application/json",
                    },
                )

        except httpx.TimeoutException as error:
            raise SportmonksAPIError(
                "Sportmonks request timed out."
            ) from error

        except httpx.RequestError as error:
            raise SportmonksAPIError(
                "Could not connect to Sportmonks API."
            ) from error

        if response.status_code == 401:
            raise SportmonksAPIError(
                "Sportmonks API token is invalid."
            )

        if response.status_code == 403:
            raise SportmonksAPIError(
                (
                    "Your Sportmonks subscription "
                    "does not allow this resource."
                )
            )

        if response.status_code == 404:
            raise SportmonksAPIError(
                "Sportmonks resource was not found."
            )

        if response.status_code == 429:
            raise SportmonksAPIError(
                (
                    "Sportmonks request limit "
                    "has been reached."
                )
            )

        if not response.is_success:
            try:
                error_data = response.json()
            except ValueError:
                error_data = response.text

            raise SportmonksAPIError(
                (
                    "Sportmonks returned "
                    f"HTTP {response.status_code}: "
                    f"{error_data}"
                )
            )

        try:
            result = response.json()

        except ValueError as error:
            raise SportmonksAPIError(
                (
                    "Sportmonks returned an "
                    "invalid JSON response."
                )
            ) from error

        if not isinstance(result, dict):
            raise SportmonksAPIError(
                (
                    "Unexpected response format "
                    "from Sportmonks."
                )
            )

        safe_params = {
            key: (
                "***HIDDEN***"
                if key == "api_token"
                else value
            )
            for key, value in request_params.items()
        }

        print("\n========== SPORTMONKS DEBUG ==========")
        print("URL:", url)
        print("PARAMS:", safe_params)
        print("STATUS:", response.status_code)
        print("RESULT:", result)
        print("=======================================\n")

        api_message = result.get("message")

        if (
            isinstance(api_message, str)
            and api_message.strip()
            and "data" not in result
        ):
            raise SportmonksAPIError(
                api_message.strip()
            )

        return result

    async def search_teams(
        self,
        name: str,
    ) -> dict[str, Any]:
        """
        البحث عن الفرق بالاسم.
        """

        clean_name = name.strip()

        if not clean_name:
            raise ValueError(
                "Team name cannot be empty."
            )

        return await self._request(
            endpoint=f"teams/search/{clean_name}",
        )

    async def get_all_teams(
        self,
        page: int = 1,
        per_page: int = 50,
    ) -> dict[str, Any]:
        """
        جلب جميع الفرق المتاحة ضمن اشتراك
        Sportmonks الحالي.
        """

        if page < 1:
            raise ValueError(
                "Page must be greater than zero."
            )

        if per_page < 1:
            raise ValueError(
                "Per page must be greater than zero."
            )

        return await self._request(
            endpoint="teams",
            params={
                "page": page,
                "per_page": per_page,
            },
        )

    async def get_team(
        self,
        sportmonks_team_id: int,
        include_statistics: bool = True,
    ) -> dict[str, Any]:
        """
        جلب فريق واحد بواسطة Sportmonks ID.
        """

        if sportmonks_team_id <= 0:
            raise ValueError(
                "Sportmonks team ID must be positive."
            )

        params: dict[str, Any] = {}

        if include_statistics:
            params["include"] = "statistics"

        return await self._request(
            endpoint=f"teams/{sportmonks_team_id}",
            params=params,
        )

    async def get_team_fixtures(
        self,
        sportmonks_team_id: int,
        start_date: date | str,
        end_date: date | str,
        include_statistics: bool = True,
    ) -> dict[str, Any]:
        """
        جلب مباريات فريق بين تاريخين.

        صيغة التاريخ:
        YYYY-MM-DD
        """

        if sportmonks_team_id <= 0:
            raise ValueError(
                "Sportmonks team ID must be positive."
            )

        start_value = self._format_date(
            start_date
        )

        end_value = self._format_date(
            end_date
        )

        if start_value > end_value:
            raise ValueError(
                "Start date cannot be after end date."
            )

        includes = [
    "participants",
    "scores",
    "league",
    "season",
    "round",
    "stage",
    "venue",
    "referees",
]

        if include_statistics:
            includes.append(
                "statistics.type"
            )

        return await self._request(
            endpoint=(
                "fixtures/between/"
                f"{start_value}/"
                f"{end_value}/"
                f"{sportmonks_team_id}"
            ),
            params={
                "include": ";".join(includes),
            },
        )

    async def get_fixture(
        self,
        fixture_id: int,
        include_statistics: bool = True,
    ) -> dict[str, Any]:
        """
        جلب تفاصيل مباراة واحدة، بما يشمل
        البطولة والموسم والجولة والمرحلة
        والملعب والحكام عند توفرها.
        """

        if fixture_id <= 0:
            raise ValueError(
                "Fixture ID must be positive."
            )

        includes = [
            "participants",
            "scores",
            "league",
            "season",
            "round",
            "stage",
            "venue",
            "referees",
        ]

        if include_statistics:
            includes.append(
                "statistics.type"
            )

        return await self._request(
            endpoint=f"fixtures/{fixture_id}",
            params={
                "include": ";".join(includes),
            },
        )


    async def get_fixture_context(
        self,
        fixture_id: int,
    ) -> dict[str, Any]:
        """
        جلب سياق المباراة المطلوب لتحليل ما قبل المباراة:

        - المشاركون
        - التشكيلات
        - الخطط
        - الإصابات والإيقافات
        - حالة الطقس
        """

        if fixture_id <= 0:
            raise ValueError(
                "Fixture ID must be positive."
            )

        includes = [
            "participants",
            "lineups.player",
            "lineups.position",
            "formations",
            "sidelined.player",
            "sidelined.type",
            "weatherReport",
        ]

        return await self._request(
            endpoint=f"fixtures/{fixture_id}",
            params={
                "include": ";".join(includes),
            },
        )

    async def get_referee(
        self,
        referee_id: int,
    ) -> dict[str, Any]:
        """
        جلب بيانات حكم واحد بواسطة
        Sportmonks referee ID.
        """

        if referee_id <= 0:
            raise ValueError(
                "Referee ID must be positive."
            )

        return await self._request(
            endpoint=f"referees/{referee_id}",
            params={},
        )

    async def get_fixtures_by_date(
        self,
        fixture_date: date | str,
        include_statistics: bool = False,
    ) -> dict[str, Any]:
        """
        جلب جميع المباريات المتاحة
        في تاريخ معين.
        """

        date_value = self._format_date(
            fixture_date
        )

        includes = [
            "participants",
            "scores",
        ]

        if include_statistics:
            includes.append(
                "statistics.type"
            )

        return await self._request(
            endpoint=f"fixtures/date/{date_value}",
            params={
                "include": ";".join(includes),
            },
        )

    @staticmethod
    def extract_data(
        response: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """
        استخراج قائمة data بأمان.

        إذا كانت data سجلًا واحدًا،
        يتم إرجاعه داخل قائمة.
        """

        data = response.get("data")

        if data is None:
            return []

        if isinstance(data, list):
            return [
                item
                for item in data
                if isinstance(item, dict)
            ]

        if isinstance(data, dict):
            return [data]

        return []

    @staticmethod
    def extract_single_data(
        response: dict[str, Any],
    ) -> dict[str, Any] | None:
        """
        استخراج سجل واحد من data.
        """

        data = response.get("data")

        if isinstance(data, dict):
            return data

        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    return item

        return None

    @staticmethod
    def extract_pagination(
        response: dict[str, Any],
    ) -> dict[str, Any]:
        """
        استخراج معلومات pagination بأمان.
        """

        pagination = response.get("pagination")

        if isinstance(pagination, dict):
            return pagination

        return {}

    @staticmethod
    def extract_subscription(
        response: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """
        استخراج بيانات subscription إن وجدت.
        """

        subscription = response.get("subscription")

        if isinstance(subscription, list):
            return [
                item
                for item in subscription
                if isinstance(item, dict)
            ]

        if isinstance(subscription, dict):
            return [subscription]

        return []

    @staticmethod
    def _format_date(
        value: date | str,
    ) -> str:
        """
        تحويل التاريخ إلى YYYY-MM-DD
        والتحقق من صحته.
        """

        if isinstance(value, date):
            return value.isoformat()

        if not isinstance(value, str):
            raise ValueError(
                "Date must be a string or date object."
            )

        clean_value = value.strip()

        if not clean_value:
            raise ValueError(
                "Date cannot be empty."
            )

        try:
            return date.fromisoformat(
                clean_value
            ).isoformat()

        except ValueError as error:
            raise ValueError(
                "Date must use YYYY-MM-DD format."
            ) from error