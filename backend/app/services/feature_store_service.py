from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class FeatureStoreService:
    """
    Stores the exact features used for every match prediction.

    Future uses:
    - Reproducing old predictions
    - Building machine-learning datasets
    - Comparing feature versions
    - Training and evaluating models
    - Supporting self-learning
    """

    MODEL_VERSION = "Feature Store V1.0"
    DEFAULT_DATABASE_PATH = Path("data/features.db")

    def __init__(
        self,
        database_path: str | Path | None = None,
    ) -> None:
        self.database_path = Path(
            database_path or self.DEFAULT_DATABASE_PATH
        )

        self.database_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        self._initialize_database()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(
            self.database_path
        )

        connection.row_factory = sqlite3.Row

        return connection

    def _initialize_database(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS match_features (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,

                    match_id INTEGER NOT NULL,
                    feature_version TEXT NOT NULL,

                    home_team_id INTEGER,
                    away_team_id INTEGER,
                    home_team_name TEXT,
                    away_team_name TEXT,
                    match_date TEXT,

                    home_expected_goals REAL,
                    away_expected_goals REAL,

                    home_team_strength REAL,
                    away_team_strength REAL,

                    home_form REAL,
                    away_form REAL,

                    home_elo REAL,
                    away_elo REAL,

                    home_advantage REAL,

                    home_rest_days REAL,
                    away_rest_days REAL,

                    home_goals_for_average REAL,
                    away_goals_for_average REAL,

                    home_goals_against_average REAL,
                    away_goals_against_average REAL,

                    home_shots_average REAL,
                    away_shots_average REAL,

                    home_shots_on_target_average REAL,
                    away_shots_on_target_average REAL,

                    home_corners_average REAL,
                    away_corners_average REAL,

                    home_cards_average REAL,
                    away_cards_average REAL,

                    features_payload TEXT NOT NULL,

                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,

                    UNIQUE (
                        match_id,
                        feature_version
                    )
                )
                """
            )

            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS
                idx_match_features_match_id
                ON match_features(match_id)
                """
            )

            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS
                idx_match_features_version
                ON match_features(feature_version)
                """
            )

            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS
                idx_match_features_match_date
                ON match_features(match_date)
                """
            )

            connection.commit()

    def save_features(
        self,
        match_id: int,
        features: dict[str, Any],
        feature_version: str = "Feature Engineering V2",
        replace_existing: bool = True,
    ) -> dict[str, Any]:
        if not isinstance(features, dict):
            raise TypeError(
                "features must be a dictionary"
            )

        if not features:
            raise ValueError(
                "features cannot be empty"
            )

        now = self._utc_now()

        extracted = self._extract_feature_values(
            features
        )

        payload = json.dumps(
            features,
            ensure_ascii=False,
            default=str,
        )

        command = (
            "INSERT OR REPLACE"
            if replace_existing
            else "INSERT"
        )

        query = f"""
            {command} INTO match_features (
                match_id,
                feature_version,

                home_team_id,
                away_team_id,
                home_team_name,
                away_team_name,
                match_date,

                home_expected_goals,
                away_expected_goals,

                home_team_strength,
                away_team_strength,

                home_form,
                away_form,

                home_elo,
                away_elo,

                home_advantage,

                home_rest_days,
                away_rest_days,

                home_goals_for_average,
                away_goals_for_average,

                home_goals_against_average,
                away_goals_against_average,

                home_shots_average,
                away_shots_average,

                home_shots_on_target_average,
                away_shots_on_target_average,

                home_corners_average,
                away_corners_average,

                home_cards_average,
                away_cards_average,

                features_payload,

                created_at,
                updated_at
            )
            VALUES (
                ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?,
                ?, ?,
                ?, ?,
                ?, ?,
                ?,
                ?, ?,
                ?, ?,
                ?, ?,
                ?, ?,
                ?, ?,
                ?, ?,
                ?, ?,
                ?,
                ?, ?
            )
        """

        values = (
            int(match_id),
            str(feature_version),

            extracted["home_team_id"],
            extracted["away_team_id"],
            extracted["home_team_name"],
            extracted["away_team_name"],
            extracted["match_date"],

            extracted["home_expected_goals"],
            extracted["away_expected_goals"],

            extracted["home_team_strength"],
            extracted["away_team_strength"],

            extracted["home_form"],
            extracted["away_form"],

            extracted["home_elo"],
            extracted["away_elo"],

            extracted["home_advantage"],

            extracted["home_rest_days"],
            extracted["away_rest_days"],

            extracted["home_goals_for_average"],
            extracted["away_goals_for_average"],

            extracted["home_goals_against_average"],
            extracted["away_goals_against_average"],

            extracted["home_shots_average"],
            extracted["away_shots_average"],

            extracted[
                "home_shots_on_target_average"
            ],
            extracted[
                "away_shots_on_target_average"
            ],

            extracted["home_corners_average"],
            extracted["away_corners_average"],

            extracted["home_cards_average"],
            extracted["away_cards_average"],

            payload,

            now,
            now,
        )

        with self._connect() as connection:
            connection.execute(
                query,
                values,
            )

            row = connection.execute(
                """
                SELECT id
                FROM match_features
                WHERE
                    match_id = ?
                    AND feature_version = ?
                """,
                (
                    int(match_id),
                    str(feature_version),
                ),
            ).fetchone()

            connection.commit()

        return {
            "status": "saved",
            "feature_record_id": (
                row["id"] if row else None
            ),
            "match_id": int(match_id),
            "feature_version": str(
                feature_version
            ),
            "feature_count": self._count_features(
                features
            ),
            "database": str(
                self.database_path
            ),
        }

    def get_features(
        self,
        match_id: int,
        feature_version: str | None = None,
    ) -> dict[str, Any] | None:
        conditions = ["match_id = ?"]
        parameters: list[Any] = [
            int(match_id)
        ]

        if feature_version is not None:
            conditions.append(
                "feature_version = ?"
            )
            parameters.append(
                str(feature_version)
            )

        where_clause = " AND ".join(
            conditions
        )

        with self._connect() as connection:
            row = connection.execute(
                f"""
                SELECT *
                FROM match_features
                WHERE {where_clause}
                ORDER BY id DESC
                LIMIT 1
                """,
                parameters,
            ).fetchone()

        if row is None:
            return None

        return self._row_to_dict(row)

    def list_feature_records(
        self,
        limit: int = 100,
        feature_version: str | None = None,
    ) -> list[dict[str, Any]]:
        limit = max(
            1,
            min(int(limit), 1000),
        )

        parameters: list[Any] = []
        where_clause = ""

        if feature_version is not None:
            where_clause = (
                "WHERE feature_version = ?"
            )
            parameters.append(
                str(feature_version)
            )

        parameters.append(limit)

        with self._connect() as connection:
            rows = connection.execute(
                f"""
                SELECT *
                FROM match_features
                {where_clause}
                ORDER BY id DESC
                LIMIT ?
                """,
                parameters,
            ).fetchall()

        return [
            self._row_to_dict(row)
            for row in rows
        ]

    def delete_features(
        self,
        match_id: int,
        feature_version: str | None = None,
    ) -> dict[str, Any]:
        conditions = ["match_id = ?"]
        parameters: list[Any] = [
            int(match_id)
        ]

        if feature_version is not None:
            conditions.append(
                "feature_version = ?"
            )
            parameters.append(
                str(feature_version)
            )

        where_clause = " AND ".join(
            conditions
        )

        with self._connect() as connection:
            cursor = connection.execute(
                f"""
                DELETE FROM match_features
                WHERE {where_clause}
                """,
                parameters,
            )

            deleted_count = cursor.rowcount
            connection.commit()

        return {
            "status": "deleted",
            "match_id": int(match_id),
            "feature_version": (
                feature_version
            ),
            "deleted_count": deleted_count,
        }

    def get_summary(self) -> dict[str, Any]:
        with self._connect() as connection:
            totals = connection.execute(
                """
                SELECT
                    COUNT(*) AS total_records,
                    COUNT(DISTINCT match_id)
                        AS unique_matches,
                    COUNT(DISTINCT feature_version)
                        AS feature_versions,
                    MIN(created_at)
                        AS first_created_at,
                    MAX(updated_at)
                        AS last_updated_at
                FROM match_features
                """
            ).fetchone()

            versions = connection.execute(
                """
                SELECT
                    feature_version,
                    COUNT(*) AS record_count
                FROM match_features
                GROUP BY feature_version
                ORDER BY record_count DESC
                """
            ).fetchall()

        return {
            "model": self.MODEL_VERSION,
            "database": str(
                self.database_path
            ),
            "total_records": int(
                totals["total_records"] or 0
            ),
            "unique_matches": int(
                totals["unique_matches"] or 0
            ),
            "feature_versions": int(
                totals["feature_versions"] or 0
            ),
            "first_created_at": totals[
                "first_created_at"
            ],
            "last_updated_at": totals[
                "last_updated_at"
            ],
            "records_by_version": [
                {
                    "feature_version": row[
                        "feature_version"
                    ],
                    "record_count": int(
                        row["record_count"]
                    ),
                }
                for row in versions
            ],
        }

    def _extract_feature_values(
        self,
        features: dict[str, Any],
    ) -> dict[str, Any]:
        return {
            "home_team_id": self._first_int(
                features,
                [
                    "home_team_id",
                    "home_id",
                ],
            ),
            "away_team_id": self._first_int(
                features,
                [
                    "away_team_id",
                    "away_id",
                ],
            ),
            "home_team_name": self._first_text(
                features,
                [
                    "home_team_name",
                    "home_team",
                ],
            ),
            "away_team_name": self._first_text(
                features,
                [
                    "away_team_name",
                    "away_team",
                ],
            ),
            "match_date": self._first_text(
                features,
                [
                    "match_date",
                    "date",
                    "kickoff",
                ],
            ),
            "home_expected_goals": self._first_number(
                features,
                [
                    "home_expected_goals",
                    "home_xg",
                    "expected_home_goals",
                ],
            ),
            "away_expected_goals": self._first_number(
                features,
                [
                    "away_expected_goals",
                    "away_xg",
                    "expected_away_goals",
                ],
            ),
            "home_team_strength": self._first_number(
                features,
                [
                    "home_team_strength",
                    "home_strength",
                ],
            ),
            "away_team_strength": self._first_number(
                features,
                [
                    "away_team_strength",
                    "away_strength",
                ],
            ),
            "home_form": self._first_number(
                features,
                [
                    "home_form",
                    "home_form_score",
                ],
            ),
            "away_form": self._first_number(
                features,
                [
                    "away_form",
                    "away_form_score",
                ],
            ),
            "home_elo": self._first_number(
                features,
                [
                    "home_elo",
                    "home_elo_rating",
                ],
            ),
            "away_elo": self._first_number(
                features,
                [
                    "away_elo",
                    "away_elo_rating",
                ],
            ),
            "home_advantage": self._first_number(
                features,
                [
                    "home_advantage",
                    "home_advantage_score",
                ],
            ),
            "home_rest_days": self._first_number(
                features,
                [
                    "home_rest_days",
                    "home_days_rest",
                ],
            ),
            "away_rest_days": self._first_number(
                features,
                [
                    "away_rest_days",
                    "away_days_rest",
                ],
            ),
            "home_goals_for_average": (
                self._first_number(
                    features,
                    [
                        "home_goals_for_average",
                        "home_avg_goals_for",
                        "home_goals_scored_avg",
                    ],
                )
            ),
            "away_goals_for_average": (
                self._first_number(
                    features,
                    [
                        "away_goals_for_average",
                        "away_avg_goals_for",
                        "away_goals_scored_avg",
                    ],
                )
            ),
            "home_goals_against_average": (
                self._first_number(
                    features,
                    [
                        "home_goals_against_average",
                        "home_avg_goals_against",
                        "home_goals_conceded_avg",
                    ],
                )
            ),
            "away_goals_against_average": (
                self._first_number(
                    features,
                    [
                        "away_goals_against_average",
                        "away_avg_goals_against",
                        "away_goals_conceded_avg",
                    ],
                )
            ),
            "home_shots_average": self._first_number(
                features,
                [
                    "home_shots_average",
                    "home_avg_shots",
                ],
            ),
            "away_shots_average": self._first_number(
                features,
                [
                    "away_shots_average",
                    "away_avg_shots",
                ],
            ),
            "home_shots_on_target_average": (
                self._first_number(
                    features,
                    [
                        "home_shots_on_target_average",
                        "home_avg_shots_on_target",
                    ],
                )
            ),
            "away_shots_on_target_average": (
                self._first_number(
                    features,
                    [
                        "away_shots_on_target_average",
                        "away_avg_shots_on_target",
                    ],
                )
            ),
            "home_corners_average": (
                self._first_number(
                    features,
                    [
                        "home_corners_average",
                        "home_avg_corners",
                    ],
                )
            ),
            "away_corners_average": (
                self._first_number(
                    features,
                    [
                        "away_corners_average",
                        "away_avg_corners",
                    ],
                )
            ),
            "home_cards_average": self._first_number(
                features,
                [
                    "home_cards_average",
                    "home_avg_cards",
                ],
            ),
            "away_cards_average": self._first_number(
                features,
                [
                    "away_cards_average",
                    "away_avg_cards",
                ],
            ),
        }

    def _row_to_dict(
        self,
        row: sqlite3.Row,
    ) -> dict[str, Any]:
        result = dict(row)

        payload = result.get(
            "features_payload"
        )

        if isinstance(payload, str):
            try:
                result["features_payload"] = (
                    json.loads(payload)
                )
            except json.JSONDecodeError:
                pass

        return result

    def _count_features(
        self,
        value: Any,
    ) -> int:
        if isinstance(value, dict):
            total = len(value)

            for nested_value in value.values():
                total += self._count_features(
                    nested_value
                )

            return total

        if isinstance(value, list):
            return sum(
                self._count_features(item)
                for item in value
            )

        return 0

    def _first_number(
        self,
        source: dict[str, Any],
        keys: list[str],
    ) -> float | None:
        for key in keys:
            if key not in source:
                continue

            value = self._to_float(
                source[key]
            )

            if value is not None:
                return value

        return None

    def _first_int(
        self,
        source: dict[str, Any],
        keys: list[str],
    ) -> int | None:
        value = self._first_number(
            source,
            keys,
        )

        if value is None:
            return None

        return int(value)

    def _first_text(
        self,
        source: dict[str, Any],
        keys: list[str],
    ) -> str | None:
        for key in keys:
            value = source.get(key)

            if value is None:
                continue

            if isinstance(value, dict):
                name = value.get("name")

                if name is not None:
                    return str(name)

                continue

            return str(value)

        return None

    def _to_float(
        self,
        value: Any,
    ) -> float | None:
        if value is None or isinstance(value, bool):
            return None

        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    def _utc_now(self) -> str:
        return datetime.now(
            timezone.utc
        ).isoformat()
