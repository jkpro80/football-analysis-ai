import os
from typing import Any

import httpx
from dotenv import load_dotenv


load_dotenv()


class SportmonksError(Exception):
    """خطأ صادر عن الاتصال بخدمة Sportmonks."""


class SportmonksClient:
    def __init__(self) -> None:
        self.base_url = os.getenv(
            "SPORTMONKS_BASE_URL",
            "https://api.sportmonks.com/v3/football",
        ).rstrip("/")

        self.api_token = os.getenv(
            "SPORTMONKS_API_TOKEN"
        )

        if not self.api_token:
            raise SportmonksError(
                "SPORTMONKS_API_TOKEN is missing from .env"
            )

    def get(
        self,
        endpoint: str,
        params: dict[str, Any] | None = None,
    ) -> dict[str, Any]:

        request_params = dict(params or {})
        request_params["api_token"] = self.api_token

        url = (
            f"{self.base_url}/"
            f"{endpoint.lstrip('/')}"
        )

        try:
            with httpx.Client(
                timeout=30.0,
            ) as client:
                response = client.get(
                    url,
                    params=request_params,
                )

                response.raise_for_status()

        except httpx.TimeoutException as error:
            raise SportmonksError(
                "Sportmonks request timed out"
            ) from error

        except httpx.HTTPStatusError as error:
            status_code = error.response.status_code

            try:
                error_body = error.response.json()
            except Exception:
                error_body = error.response.text

            raise SportmonksError(
                f"Sportmonks returned HTTP {status_code}: {error_body}"
            ) from error

        except httpx.RequestError as error:
            raise SportmonksError(
                "Could not connect to Sportmonks"
            ) from error

        try:
            data = response.json()

        except ValueError as error:
            raise SportmonksError(
                "Sportmonks returned invalid JSON"
            ) from error

        if not isinstance(data, dict):
            raise SportmonksError(
                "Unexpected Sportmonks response"
            )

        #
        # SportMonks قد يعيد HTTP 200 ولكن بدون data
        # ويضع رسالة الخطأ داخل message
        #
        api_message = data.get("message")

        if api_message and data.get("data") is None:
            raise SportmonksError(api_message)

        return data