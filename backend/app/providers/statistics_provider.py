from typing import Any

from app.providers.sportmonks_client import (
    SportmonksClient,
)


class StatisticsProvider:
    """
    جلب إحصائيات المباريات من Sportmonks
    وتحويلها إلى صيغة مبسطة.
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

    def get_fixture_statistics(
        self,
        fixture_id: int,
    ) -> dict[str, Any]:
        """
        جلب بيانات مباراة واحدة مع:
        - الإحصائيات
        - أنواع الإحصائيات
        - الفريقين المشاركين
        """

        if fixture_id <= 0:
            raise ValueError(
                "fixture_id must be greater than zero."
            )

        return self.client.get(
            endpoint=f"fixtures/{fixture_id}",
            params={
                "include": (
                    "statistics.type;"
                    "participants"
                ),
            },
        )

    @staticmethod
    def extract_value(
        statistic: dict[str, Any],
    ) -> float | None:
        """
        استخراج القيمة الرقمية من الإحصائية.

        يدعم:
        - 54
        - 54.5
        - "54"
        - "54%"
        - {"value": 54}
        - {"value": {"total": 54}}
        """

        data = statistic.get("data")

        value: Any = None

        if isinstance(data, dict):
            value = data.get("value")

            if isinstance(value, dict):
                value = (
                    value.get("total")
                    or value.get("amount")
                    or value.get("value")
                )

        if value is None:
            value = statistic.get("value")

        if isinstance(value, dict):
            value = (
                value.get("total")
                or value.get("amount")
                or value.get("value")
            )

        if value is None:
            return None

        if isinstance(value, bool):
            return float(int(value))

        if isinstance(value, str):
            normalized_value = (
                value.replace("%", "")
                .replace(",", ".")
                .strip()
            )

            if not normalized_value:
                return None

            value = normalized_value

        try:
            return float(value)

        except (TypeError, ValueError):
            return None

    @staticmethod
    def normalize_text(
        value: Any,
    ) -> str | None:
        """
        توحيد أسماء الإحصائيات.
        """

        if value is None:
            return None

        normalized = (
            str(value)
            .strip()
            .replace("-", "_")
            .replace(" ", "_")
            .replace("/", "_")
            .lower()
        )

        while "__" in normalized:
            normalized = normalized.replace(
                "__",
                "_",
            )

        return normalized or None

    @classmethod
    def normalize_stat_name(
        cls,
        statistic: dict[str, Any],
    ) -> str | None:
        """
        استخراج اسم الإحصائية من أكثر من شكل محتمل.
        """

        stat_type = statistic.get("type")

        if isinstance(stat_type, dict):
            for key in (
                "developer_name",
                "code",
                "name",
            ):
                normalized = cls.normalize_text(
                    stat_type.get(key)
                )

                if normalized:
                    return normalized

        for key in (
            "developer_name",
            "code",
            "name",
            "type_name",
        ):
            normalized = cls.normalize_text(
                statistic.get(key)
            )

            if normalized:
                return normalized

        return None

    @staticmethod
    def extract_collection(
        value: Any,
    ) -> list[dict[str, Any]]:
        """
        استخراج قائمة من الأشكال المحتملة:

        [...]
        {"data": [...]}
        {"items": [...]}
        """

        if isinstance(value, list):
            return [
                item
                for item in value
                if isinstance(item, dict)
            ]

        if isinstance(value, dict):
            for key in (
                "data",
                "items",
                "results",
            ):
                nested_value = value.get(key)

                if isinstance(
                    nested_value,
                    list,
                ):
                    return [
                        item
                        for item
                        in nested_value
                        if isinstance(
                            item,
                            dict,
                        )
                    ]

        return []

    @staticmethod
    def get_participant_location(
        participant: dict[str, Any],
    ) -> str | None:
        """
        معرفة هل الفريق صاحب الأرض أو الضيف.
        """

        meta = participant.get("meta")

        if isinstance(meta, dict):
            location = meta.get("location")

            if location in {
                "home",
                "away",
            }:
                return str(location)

        location = participant.get("location")

        if location in {
            "home",
            "away",
        }:
            return str(location)

        return None

    @staticmethod
    def extract_fixture(
        response: dict[str, Any],
    ) -> dict[str, Any] | None:
        """
        استخراج سجل المباراة من الاستجابة.
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
    def resolve_location_from_statistic(
        statistic: dict[str, Any],
    ) -> str | None:
        """
        استخراج home أو away مباشرة من الإحصائية.
        """

        for key in (
            "location",
            "participant",
            "side",
        ):
            value = statistic.get(key)

            if isinstance(value, str):
                normalized = value.lower()

                if normalized in {
                    "home",
                    "away",
                }:
                    return normalized

        return None

    def get_simple_fixture_statistics(
        self,
        fixture_id: int,
    ) -> dict[str, Any]:
        """
        تحويل إحصائيات المباراة إلى:

        {
            "fixture_id": 123,
            "statistics_count": 20,
            "participants_count": 2,
            "mapped_statistics_count": 18,
            "home": {...},
            "away": {...}
        }
        """

        response = self.get_fixture_statistics(
            fixture_id
        )

        fixture = self.extract_fixture(
            response
        )

        if fixture is None:
            return {
                "fixture_id": fixture_id,
                "statistics_count": 0,
                "participants_count": 0,
                "mapped_statistics_count": 0,
                "home": {},
                "away": {},
            }

        statistics = self.extract_collection(
            fixture.get("statistics")
        )

        participants = self.extract_collection(
            fixture.get("participants")
        )

        participant_locations: dict[
            int,
            str,
        ] = {}

        for participant in participants:
            participant_id = (
                participant.get("id")
            )

            if participant_id is None:
                continue

            location = (
                self.get_participant_location(
                    participant
                )
            )

            if location is None:
                continue

            try:
                participant_locations[
                    int(participant_id)
                ] = location

            except (TypeError, ValueError):
                continue

        result: dict[str, Any] = {
            "fixture_id": fixture_id,
            "statistics_count": len(
                statistics
            ),
            "participants_count": len(
                participants
            ),
            "mapped_statistics_count": 0,
            "home": {},
            "away": {},
        }

        mapped_statistics_count = 0

        for statistic in statistics:
            participant_id = statistic.get(
                "participant_id"
            )

            location: str | None = None

            if participant_id is not None:
                try:
                    location = (
                        participant_locations.get(
                            int(participant_id)
                        )
                    )

                except (TypeError, ValueError):
                    location = None

            if location not in {
                "home",
                "away",
            }:
                location = (
                    self
                    .resolve_location_from_statistic(
                        statistic
                    )
                )

            if location not in {
                "home",
                "away",
            }:
                continue

            stat_name = (
                self.normalize_stat_name(
                    statistic
                )
            )

            stat_value = self.extract_value(
                statistic
            )

            if (
                stat_name is None
                or stat_value is None
            ):
                continue

            result[location][
                stat_name
            ] = stat_value

            mapped_statistics_count += 1

        result[
            "mapped_statistics_count"
        ] = mapped_statistics_count

        return result