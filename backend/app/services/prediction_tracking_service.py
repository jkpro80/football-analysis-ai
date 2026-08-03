from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


class PredictionTrackingService:
    """
    Stores predictions and actual match results in SQLite.

    This database will later be used for:
    - Accuracy evaluation
    - Ensemble weight optimisation
    - Machine learning datasets
    - Self-learning
    """

    MODEL_VERSION = "Prediction Tracking System V1.0"

    DEFAULT_DATABASE_PATH = Path("data/predictions.db")

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
        connection.execute(
            "PRAGMA foreign_keys = ON"
        )

        return connection

    def _initialize_database(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS predictions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    match_id INTEGER NOT NULL,
                    model_version TEXT NOT NULL,
                    prediction_time TEXT NOT NULL,

                    home_team TEXT,
                    away_team TEXT,
                    match_date TEXT,

                    recommended_outcome TEXT,

                    home_win_probability REAL,
                    draw_probability REAL,
                    away_win_probability REAL,

                    expected_home_goals REAL,
                    expected_away_goals REAL,
                    expected_total_goals REAL,

                    confidence REAL,
                    risk_level TEXT,

                    ensemble_agreement REAL,
                    ensemble_stability REAL,

                    prediction_payload TEXT NOT NULL,

                    actual_home_goals INTEGER,
                    actual_away_goals INTEGER,
                    actual_outcome TEXT,
                    result_recorded_at TEXT,

                    prediction_correct INTEGER,
                    home_goals_error REAL,
                    away_goals_error REAL,
                    total_goals_error REAL,

                    status TEXT NOT NULL DEFAULT 'pending',

                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )

            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS
                idx_predictions_match_id
                ON predictions(match_id)
                """
            )

            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS
                idx_predictions_status
                ON predictions(status)
                """
            )

            connection.execute(
                """
                CREATE INDEX IF NOT EXISTS
                idx_predictions_model_version
                ON predictions(model_version)
                """
            )

            connection.commit()

    def save_prediction(
        self,
        prediction: dict[str, Any],
        match_id: int | None = None,
    ) -> dict[str, Any]:
        now = self._utc_now()

        resolved_match_id = self._resolve_match_id(
            prediction=prediction,
            match_id=match_id,
        )

        if resolved_match_id is None:
            raise ValueError(
                "match_id is required to save a prediction"
            )

        extracted = self._extract_prediction_data(
            prediction
        )

        payload = json.dumps(
            prediction,
            ensure_ascii=False,
            default=str,
        )

        with self._connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO predictions (
                    match_id,
                    model_version,
                    prediction_time,

                    home_team,
                    away_team,
                    match_date,

                    recommended_outcome,

                    home_win_probability,
                    draw_probability,
                    away_win_probability,

                    expected_home_goals,
                    expected_away_goals,
                    expected_total_goals,

                    confidence,
                    risk_level,

                    ensemble_agreement,
                    ensemble_stability,

                    prediction_payload,

                    status,
                    created_at,
                    updated_at
                )
                VALUES (
                    ?, ?, ?,
                    ?, ?, ?,
                    ?,
                    ?, ?, ?,
                    ?, ?, ?,
                    ?, ?,
                    ?, ?,
                    ?,
                    'pending',
                    ?, ?
                )
                """,
                (
                    resolved_match_id,
                    extracted["model_version"],
                    now,

                    extracted["home_team"],
                    extracted["away_team"],
                    extracted["match_date"],

                    extracted["recommended_outcome"],

                    extracted["home_win_probability"],
                    extracted["draw_probability"],
                    extracted["away_win_probability"],

                    extracted["expected_home_goals"],
                    extracted["expected_away_goals"],
                    extracted["expected_total_goals"],

                    extracted["confidence"],
                    extracted["risk_level"],

                    extracted["ensemble_agreement"],
                    extracted["ensemble_stability"],

                    payload,

                    now,
                    now,
                ),
            )

            prediction_id = cursor.lastrowid
            connection.commit()

        return {
            "status": "saved",
            "prediction_id": prediction_id,
            "match_id": resolved_match_id,
            "model_version": extracted["model_version"],
            "database": str(self.database_path),
        }

    def record_actual_result(
        self,
        prediction_id: int,
        actual_home_goals: int,
        actual_away_goals: int,
    ) -> dict[str, Any]:
        if actual_home_goals < 0 or actual_away_goals < 0:
            raise ValueError(
                "Actual goals cannot be negative"
            )

        prediction = self.get_prediction(
            prediction_id
        )

        if prediction is None:
            raise ValueError(
                f"Prediction {prediction_id} was not found"
            )

        actual_outcome = self._outcome_from_score(
            home_goals=actual_home_goals,
            away_goals=actual_away_goals,
        )

        recommended_outcome = prediction.get(
            "recommended_outcome"
        )

        prediction_correct = int(
            self._normalise_outcome(
                recommended_outcome
            ) == actual_outcome
        )

        expected_home = self._to_float(
            prediction.get("expected_home_goals")
        )
        expected_away = self._to_float(
            prediction.get("expected_away_goals")
        )
        expected_total = self._to_float(
            prediction.get("expected_total_goals")
        )

        actual_total = (
            actual_home_goals + actual_away_goals
        )

        home_error = (
            abs(expected_home - actual_home_goals)
            if expected_home is not None
            else None
        )

        away_error = (
            abs(expected_away - actual_away_goals)
            if expected_away is not None
            else None
        )

        total_error = (
            abs(expected_total - actual_total)
            if expected_total is not None
            else None
        )

        now = self._utc_now()

        with self._connect() as connection:
            connection.execute(
                """
                UPDATE predictions
                SET
                    actual_home_goals = ?,
                    actual_away_goals = ?,
                    actual_outcome = ?,
                    result_recorded_at = ?,
                    prediction_correct = ?,
                    home_goals_error = ?,
                    away_goals_error = ?,
                    total_goals_error = ?,
                    status = 'completed',
                    updated_at = ?
                WHERE id = ?
                """,
                (
                    actual_home_goals,
                    actual_away_goals,
                    actual_outcome,
                    now,
                    prediction_correct,
                    home_error,
                    away_error,
                    total_error,
                    now,
                    prediction_id,
                ),
            )

            connection.commit()

        return {
            "status": "completed",
            "prediction_id": prediction_id,
            "match_id": prediction["match_id"],
            "actual_score": {
                "home": actual_home_goals,
                "away": actual_away_goals,
            },
            "actual_outcome": actual_outcome,
            "recommended_outcome": recommended_outcome,
            "prediction_correct": bool(
                prediction_correct
            ),
            "errors": {
                "home_goals": self._round_optional(
                    home_error
                ),
                "away_goals": self._round_optional(
                    away_error
                ),
                "total_goals": self._round_optional(
                    total_error
                ),
            },
        }

    def record_result_by_match_id(
        self,
        match_id: int,
        actual_home_goals: int,
        actual_away_goals: int,
    ) -> list[dict[str, Any]]:
        pending_predictions = self.list_predictions(
            match_id=match_id,
            status="pending",
        )

        results: list[dict[str, Any]] = []

        for prediction in pending_predictions:
            results.append(
                self.record_actual_result(
                    prediction_id=prediction["id"],
                    actual_home_goals=actual_home_goals,
                    actual_away_goals=actual_away_goals,
                )
            )

        return results

    def get_prediction(
        self,
        prediction_id: int,
    ) -> dict[str, Any] | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT *
                FROM predictions
                WHERE id = ?
                """,
                (prediction_id,),
            ).fetchone()

        if row is None:
            return None

        return self._row_to_dict(row)

    def list_predictions(
        self,
        limit: int = 100,
        status: str | None = None,
        match_id: int | None = None,
    ) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 1000))

        conditions: list[str] = []
        parameters: list[Any] = []

        if status is not None:
            conditions.append("status = ?")
            parameters.append(status)

        if match_id is not None:
            conditions.append("match_id = ?")
            parameters.append(match_id)

        where_clause = ""

        if conditions:
            where_clause = (
                "WHERE " + " AND ".join(conditions)
            )

        parameters.append(limit)

        query = f"""
            SELECT *
            FROM predictions
            {where_clause}
            ORDER BY id DESC
            LIMIT ?
        """

        with self._connect() as connection:
            rows = connection.execute(
                query,
                parameters,
            ).fetchall()

        return [
            self._row_to_dict(row)
            for row in rows
        ]

    def get_accuracy_summary(
        self,
        model_version: str | None = None,
    ) -> dict[str, Any]:
        conditions = ["status = 'completed'"]
        parameters: list[Any] = []

        if model_version is not None:
            conditions.append("model_version = ?")
            parameters.append(model_version)

        where_clause = " AND ".join(conditions)

        with self._connect() as connection:
            row = connection.execute(
                f"""
                SELECT
                    COUNT(*) AS completed_predictions,
                    SUM(prediction_correct) AS correct_predictions,
                    AVG(prediction_correct) AS accuracy,
                    AVG(home_goals_error) AS avg_home_goals_error,
                    AVG(away_goals_error) AS avg_away_goals_error,
                    AVG(total_goals_error) AS avg_total_goals_error,
                    AVG(confidence) AS avg_confidence,
                    AVG(ensemble_agreement) AS avg_agreement,
                    AVG(ensemble_stability) AS avg_stability
                FROM predictions
                WHERE {where_clause}
                """,
                parameters,
            ).fetchone()

        completed = int(
            row["completed_predictions"] or 0
        )

        correct = int(
            row["correct_predictions"] or 0
        )

        accuracy = self._to_float(
            row["accuracy"]
        )

        return {
            "model": self.MODEL_VERSION,
            "model_version_filter": model_version,
            "completed_predictions": completed,
            "correct_predictions": correct,
            "incorrect_predictions": (
                completed - correct
            ),
            "accuracy_percentage": round(
                (accuracy or 0.0) * 100.0,
                2,
            ),
            "average_errors": {
                "home_goals": self._round_optional(
                    row["avg_home_goals_error"]
                ),
                "away_goals": self._round_optional(
                    row["avg_away_goals_error"]
                ),
                "total_goals": self._round_optional(
                    row["avg_total_goals_error"]
                ),
            },
            "average_confidence": self._round_optional(
                row["avg_confidence"]
            ),
            "average_ensemble_agreement": (
                self._round_optional(
                    row["avg_agreement"]
                )
            ),
            "average_ensemble_stability": (
                self._round_optional(
                    row["avg_stability"]
                )
            ),
        }

    def _extract_prediction_data(
        self,
        prediction: dict[str, Any],
    ) -> dict[str, Any]:
        ensemble = self._as_dict(
            prediction.get("ensemble")
        )

        decision = self._as_dict(
            prediction.get("decision")
        )

        match_data = self._extract_match_data(
            prediction
        )

        probabilities = self._extract_probabilities(
            prediction=prediction,
            ensemble=ensemble,
        )

        expected_goals = self._extract_expected_goals(
            prediction=prediction,
            decision=decision,
        )

        recommendation = self._extract_recommendation(
            decision=decision,
            ensemble=ensemble,
        )

        confidence = self._extract_confidence(
            decision=decision,
            prediction=prediction,
        )

        risk_level = self._extract_risk_level(
            decision
        )

        agreement = self._nested_number(
            ensemble,
            ["agreement", "score"],
        )

        stability = self._nested_number(
            ensemble,
            ["stability", "score"],
        )

        return {
            "model_version": str(
                prediction.get(
                    "model",
                    "unknown",
                )
            ),
            "home_team": match_data.get(
                "home_team"
            ),
            "away_team": match_data.get(
                "away_team"
            ),
            "match_date": match_data.get(
                "match_date"
            ),
            "recommended_outcome": recommendation,
            "home_win_probability": (
                probabilities["home_win"]
            ),
            "draw_probability": (
                probabilities["draw"]
            ),
            "away_win_probability": (
                probabilities["away_win"]
            ),
            "expected_home_goals": (
                expected_goals["home"]
            ),
            "expected_away_goals": (
                expected_goals["away"]
            ),
            "expected_total_goals": (
                expected_goals["total"]
            ),
            "confidence": confidence,
            "risk_level": risk_level,
            "ensemble_agreement": agreement,
            "ensemble_stability": stability,
        }

    def _extract_probabilities(
        self,
        prediction: dict[str, Any],
        ensemble: dict[str, Any],
    ) -> dict[str, float | None]:
        candidates: list[Any] = [
            ensemble.get("probabilities"),
        ]

        markets = self._as_dict(
            prediction.get("markets")
        )
        candidates.append(
            markets.get("match_result")
        )

        poisson = self._as_dict(
            prediction.get("poisson")
        )
        candidates.append(
            poisson.get("match_result")
        )

        candidates.append(
            prediction.get("probabilities")
        )

        for candidate in candidates:
            if not isinstance(candidate, dict):
                continue

            home = self._first_number(
                candidate,
                ["home_win", "home"],
            )

            draw = self._first_number(
                candidate,
                ["draw", "x"],
            )

            away = self._first_number(
                candidate,
                ["away_win", "away"],
            )

            if (
                home is not None
                and draw is not None
                and away is not None
            ):
                return {
                    "home_win": self._percentage(
                        home
                    ),
                    "draw": self._percentage(
                        draw
                    ),
                    "away_win": self._percentage(
                        away
                    ),
                }

        return {
            "home_win": None,
            "draw": None,
            "away_win": None,
        }

    def _extract_expected_goals(
        self,
        prediction: dict[str, Any],
        decision: dict[str, Any],
    ) -> dict[str, float | None]:
        sources: list[Any] = [
            decision.get("expected_goals"),
            prediction.get("expected_goals"),
        ]

        poisson = self._as_dict(
            prediction.get("poisson")
        )

        sources.append(
            poisson.get("input")
        )

        for source in sources:
            if not isinstance(source, dict):
                continue

            home = self._first_number(
                source,
                [
                    "home",
                    "home_xg",
                    "home_expected_goals",
                    "expected_home_goals",
                ],
            )

            away = self._first_number(
                source,
                [
                    "away",
                    "away_xg",
                    "away_expected_goals",
                    "expected_away_goals",
                ],
            )

            total = self._first_number(
                source,
                [
                    "total",
                    "total_xg",
                    "total_expected_goals",
                    "expected_total_goals",
                ],
            )

            if home is not None and away is not None:
                if total is None:
                    total = home + away

                return {
                    "home": home,
                    "away": away,
                    "total": total,
                }

        return {
            "home": None,
            "away": None,
            "total": None,
        }

    def _extract_recommendation(
        self,
        decision: dict[str, Any],
        ensemble: dict[str, Any],
    ) -> str | None:
        recommendation = decision.get(
            "recommendation"
        )

        if isinstance(recommendation, dict):
            for key in (
                "outcome",
                "selection",
                "market",
                "value",
            ):
                value = recommendation.get(key)

                if value is not None:
                    return str(value)

        if recommendation is not None:
            return str(recommendation)

        ensemble_outcome = ensemble.get(
            "recommended_outcome"
        )

        if ensemble_outcome is not None:
            return str(ensemble_outcome)

        return None

    def _extract_confidence(
        self,
        decision: dict[str, Any],
        prediction: dict[str, Any],
    ) -> float | None:
        decision_confidence = decision.get(
            "confidence"
        )

        if isinstance(decision_confidence, dict):
            value = self._first_number(
                decision_confidence,
                ["value", "score", "percentage"],
            )

            if value is not None:
                return self._percentage(value)

        direct = self._to_float(
            decision_confidence
        )

        if direct is not None:
            return self._percentage(direct)

        confidence = self._as_dict(
            prediction.get("confidence")
        )

        value = self._first_number(
            confidence,
            ["value", "score", "percentage"],
        )

        if value is not None:
            return self._percentage(value)

        return None

    def _extract_risk_level(
        self,
        decision: dict[str, Any],
    ) -> str | None:
        risk = decision.get("risk")

        if isinstance(risk, dict):
            level = risk.get("level")

            if level is not None:
                return str(level)

        if risk is not None:
            return str(risk)

        return None

    def _extract_match_data(
        self,
        prediction: dict[str, Any],
    ) -> dict[str, Any]:
        sources = [
            prediction.get("match"),
            prediction.get("match_info"),
            prediction.get("fixture"),
            prediction.get("data"),
        ]

        for source in sources:
            if not isinstance(source, dict):
                continue

            home_team = self._first_value(
                source,
                [
                    "home_team",
                    "home_team_name",
                    "home",
                ],
            )

            away_team = self._first_value(
                source,
                [
                    "away_team",
                    "away_team_name",
                    "away",
                ],
            )

            match_date = self._first_value(
                source,
                [
                    "match_date",
                    "date",
                    "kickoff",
                    "start_time",
                ],
            )

            if (
                home_team is not None
                or away_team is not None
                or match_date is not None
            ):
                return {
                    "home_team": self._team_name(
                        home_team
                    ),
                    "away_team": self._team_name(
                        away_team
                    ),
                    "match_date": (
                        str(match_date)
                        if match_date is not None
                        else None
                    ),
                }

        return {
            "home_team": None,
            "away_team": None,
            "match_date": None,
        }

    def _resolve_match_id(
        self,
        prediction: dict[str, Any],
        match_id: int | None,
    ) -> int | None:
        if match_id is not None:
            return int(match_id)

        direct = prediction.get("match_id")

        if direct is not None:
            return int(direct)

        match = prediction.get("match")

        if isinstance(match, dict):
            nested = match.get("id")

            if nested is not None:
                return int(nested)

        return None

    def _row_to_dict(
        self,
        row: sqlite3.Row,
    ) -> dict[str, Any]:
        result = dict(row)

        payload = result.get(
            "prediction_payload"
        )

        if isinstance(payload, str):
            try:
                result["prediction_payload"] = (
                    json.loads(payload)
                )
            except json.JSONDecodeError:
                pass

        if result.get("prediction_correct") is not None:
            result["prediction_correct"] = bool(
                result["prediction_correct"]
            )

        return result

    def _outcome_from_score(
        self,
        home_goals: int,
        away_goals: int,
    ) -> str:
        if home_goals > away_goals:
            return "home_win"

        if home_goals < away_goals:
            return "away_win"

        return "draw"

    def _normalise_outcome(
        self,
        value: Any,
    ) -> str | None:
        if value is None:
            return None

        normalised = (
            str(value)
            .strip()
            .lower()
            .replace("-", "_")
            .replace(" ", "_")
        )

        mappings = {
            "home": "home_win",
            "home_win": "home_win",
            "1": "home_win",
            "draw": "draw",
            "x": "draw",
            "away": "away_win",
            "away_win": "away_win",
            "2": "away_win",
        }

        return mappings.get(
            normalised,
            normalised,
        )

    def _percentage(
        self,
        value: float,
    ) -> float:
        if 0.0 <= value <= 1.0:
            value *= 100.0

        return round(value, 4)

    def _nested_number(
        self,
        source: dict[str, Any],
        keys: list[str],
    ) -> float | None:
        current: Any = source

        for key in keys:
            if not isinstance(current, dict):
                return None

            current = current.get(key)

        return self._to_float(current)

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

    def _first_value(
        self,
        source: dict[str, Any],
        keys: list[str],
    ) -> Any:
        for key in keys:
            if key in source:
                return source[key]

        return None

    def _team_name(
        self,
        value: Any,
    ) -> str | None:
        if value is None:
            return None

        if isinstance(value, dict):
            for key in ("name", "team_name", "title"):
                if value.get(key) is not None:
                    return str(value[key])

            return None

        return str(value)

    def _as_dict(
        self,
        value: Any,
    ) -> dict[str, Any]:
        if isinstance(value, dict):
            return value

        return {}

    def _round_optional(
        self,
        value: Any,
        digits: int = 4,
    ) -> float | None:
        number = self._to_float(value)

        if number is None:
            return None

        return round(number, digits)

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
