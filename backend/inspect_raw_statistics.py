from __future__ import annotations

from collections import Counter
from typing import Any

from sqlalchemy import select

from app.database.database import SessionLocal
from app.database.models import MatchStatistic


def flatten_keys(
    value: Any,
    prefix: str = "",
) -> list[str]:
    keys: list[str] = []

    if isinstance(value, dict):
        for key, nested_value in value.items():
            full_key = f"{prefix}.{key}" if prefix else str(key)
            keys.append(full_key)
            keys.extend(
                flatten_keys(
                    nested_value,
                    full_key,
                )
            )

    elif isinstance(value, list):
        for item in value[:3]:
            keys.extend(
                flatten_keys(
                    item,
                    prefix,
                )
            )

    return keys


def main() -> None:
    db = SessionLocal()

    try:
        statement = (
            select(MatchStatistic)
            .where(
                MatchStatistic.raw_statistics.is_not(None)
            )
            .order_by(
                MatchStatistic.id.desc()
            )
            .limit(100)
        )

        rows = list(
            db.scalars(statement).all()
        )

        key_counter: Counter[str] = Counter()

        for row in rows:
            raw_statistics = row.raw_statistics

            if not isinstance(raw_statistics, dict):
                continue

            key_counter.update(
                flatten_keys(raw_statistics)
            )

        print(f"Rows inspected: {len(rows)}")
        print()
        print("=== ALL RAW STATISTIC KEYS ===")

        for key, count in key_counter.most_common():
            print(f"{count:>4}  {key}")

        interesting_terms = (
            "shot",
            "goal",
            "expected",
            "xg",
            "possession",
            "corner",
            "assist",
            "card",
            "dribble",
            "chance",
        )

        print()
        print("=== INTERESTING KEYS ===")

        for key, count in key_counter.most_common():
            normalized = key.lower()

            if any(
                term in normalized
                for term in interesting_terms
            ):
                print(f"{count:>4}  {key}")

        print()
        print("=== SAMPLE RAW STATISTICS ===")

        for row in rows[:5]:
            print()
            print(
                f"match_statistic_id={row.id} "
                f"fixture_id={row.fixture_id} "
                f"team_id={row.team_id}"
            )
            print(row.raw_statistics)

    finally:
        db.close()


if __name__ == "__main__":
    main()
