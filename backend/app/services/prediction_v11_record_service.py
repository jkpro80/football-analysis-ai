from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Match, PredictionRecord
from app.services.prediction_v11_service import PredictionV11Service


class PredictionV11RecordService:
    """
    Generate Prediction Engine V11 results and persist them
    in the PostgreSQL prediction_records table.

    The public contract intentionally matches
    PredictionV5RecordService so existing callers can migrate
    without changing their workflow.
    """

    MODEL_VERSION = "Prediction Engine V11"

    def __init__(self, db: Session) -> None:
        if db is None:
            raise ValueError("Database session is required.")

        self.db = db
        self.prediction_service = PredictionV11Service(db=db)

    def get_existing_record(
        self,
        fixture_id: int,
    ) -> PredictionRecord | None:
        statement = (
            select(PredictionRecord)
            .where(
                PredictionRecord.match_id == fixture_id,
                PredictionRecord.model_version == self.MODEL_VERSION,
            )
            .order_by(PredictionRecord.id.desc())
        )

        return self.db.scalar(statement)

    def save_fixture_prediction(
        self,
        fixture_id: int,
        recent_limit: int = 5,
        replace_existing: bool = False,
    ) -> dict[str, Any]:
        """
        Generate and save one V11 prediction.

        recent_limit remains in the signature for compatibility
        with the current orchestrator. Prediction Engine V11
        currently loads its required data internally.
        """

        del recent_limit

        fixture_id = self._positive_integer(
            fixture_id,
            field_name="fixture_id",
        )

        match = self.db.get(Match, fixture_id)

        if match is None:
            raise ValueError(
                f"Match not found for fixture_id={fixture_id}."
            )

        existing_record = self.get_existing_record(
            fixture_id=fixture_id,
        )

        if existing_record is not None and not replace_existing:
            return {
                "status": "success",
                "created": False,
                "replaced": False,
                "message": (
                    "Prediction V11 record already exists."
                ),
                "model_version": self.MODEL_VERSION,
                "record": self.serialize_record(
                    existing_record
                ),
            }

        prediction = self.prediction_service.predict_match(
            match_id=fixture_id,
        )

        if not isinstance(prediction, dict):
            raise TypeError(
                "PredictionV11Service.predict_match must return a dictionary."
            )

        if prediction.get("success") is False:
            raise RuntimeError(
                self._prediction_error_message(prediction)
            )

        mapped = self._map_prediction(prediction)

        is_replacing = (
            existing_record is not None
            and replace_existing
        )

        if is_replacing:
            record = existing_record
        else:
            record = PredictionRecord(
                match_id=fixture_id,
            )
            self.db.add(record)

        record.model_version = self.MODEL_VERSION
        record.created_at = datetime.now(timezone.utc)

        record.expected_home_goals = mapped[
            "expected_home_goals"
        ]
        record.expected_away_goals = mapped[
            "expected_away_goals"
        ]
        record.expected_total_goals = mapped[
            "expected_total_goals"
        ]

        record.home_win_probability = mapped[
            "home_win_probability"
        ]
        record.draw_probability = mapped[
            "draw_probability"
        ]
        record.away_win_probability = mapped[
            "away_win_probability"
        ]
        record.over_2_5_probability = mapped[
            "over_2_5_probability"
        ]
        record.btts_probability = mapped[
            "btts_probability"
        ]

        record.predicted_score = mapped[
            "predicted_score"
        ]
        record.best_pick_key = mapped[
            "best_pick_key"
        ]
        record.best_pick_label = mapped[
            "best_pick_label"
        ]
        record.best_pick_probability = mapped[
            "best_pick_probability"
        ]

        record.confidence = mapped[
            "confidence_label"
        ]
        record.confidence_score = mapped[
            "confidence_score"
        ]

        self._reset_evaluation(record)

        try:
            self.db.commit()
            self.db.refresh(record)
        except Exception:
            self.db.rollback()
            raise

        return {
            "status": "success",
            "created": not is_replacing,
            "replaced": is_replacing,
            "model_version": self.MODEL_VERSION,
            "record": self.serialize_record(record),
            "prediction": prediction,
        }

    def _map_prediction(
        self,
        prediction: dict[str, Any],
    ) -> dict[str, Any]:
        expected_goals = self._dictionary(
            prediction.get("expected_goals")
        )
        result_prediction = self._dictionary(
            prediction.get("prediction")
        )
        most_likely_score = self._dictionary(
            prediction.get("most_likely_score")
        )

        raw_top_scores = prediction.get("top_scores")
        top_scores = (
            raw_top_scores
            if isinstance(raw_top_scores, list)
            else []
        )
        totals = self._dictionary(
            prediction.get("totals")
        )
        btts = self._dictionary(
            prediction.get("btts")
        )
        confidence = self._dictionary(
            prediction.get("confidence")
        )

        expected_home = self._number(
            expected_goals.get("home")
        )
        expected_away = self._number(
            expected_goals.get("away")
        )
        expected_total = self._number(
            expected_goals.get("total"),
            default=expected_home + expected_away,
        )

        home_win = self._number(
            result_prediction.get("home_win")
        )
        draw = self._number(
            result_prediction.get("draw")
        )
        away_win = self._number(
            result_prediction.get("away_win")
        )

        over_2_5 = self._extract_over_2_5(totals)
        btts_yes = self._extract_btts_yes(btts)

        predicted_score = self._predicted_score(
            most_likely_score=most_likely_score,
            top_scores=top_scores,
            home_win=home_win,
            draw=draw,
            away_win=away_win,
        )

        best_pick_key, best_pick_label, best_pick_probability = (
            self._best_pick(
                home_win=home_win,
                draw=draw,
                away_win=away_win,
                over_2_5=over_2_5,
                btts_yes=btts_yes,
            )
        )

        confidence_label = self._confidence_label(
            confidence
        )
        confidence_score = self._confidence_score(
            confidence=confidence,
            home_win=home_win,
            draw=draw,
            away_win=away_win,
        )

        return {
            "expected_home_goals": expected_home,
            "expected_away_goals": expected_away,
            "expected_total_goals": expected_total,
            "home_win_probability": home_win,
            "draw_probability": draw,
            "away_win_probability": away_win,
            "over_2_5_probability": over_2_5,
            "btts_probability": btts_yes,
            "predicted_score": predicted_score,
            "best_pick_key": best_pick_key,
            "best_pick_label": best_pick_label,
            "best_pick_probability": best_pick_probability,
            "confidence_label": confidence_label,
            "confidence_score": confidence_score,
        }

    @classmethod
    def _extract_over_2_5(
        cls,
        totals: dict[str, Any],
    ) -> float:
        market_2_5 = cls._dictionary(
            totals.get("2.5")
        )

        return cls._first_number(
            totals.get("over_2_5"),
            totals.get("over_2.5"),
            totals.get("over25"),
            totals.get("over_25"),
            market_2_5.get("over"),
            default=0.0,
        )

    @classmethod
    def _extract_btts_yes(
        cls,
        btts: dict[str, Any],
    ) -> float:
        return cls._first_number(
            btts.get("yes"),
            btts.get("btts_yes"),
            btts.get("probability"),
            btts.get("both_teams_to_score"),
            default=0.0,
        )

    @classmethod
    def _predicted_score(
        cls,
        *,
        most_likely_score: dict[str, Any],
        top_scores: list[Any],
        home_win: float,
        draw: float,
        away_win: float,
    ) -> str | None:
        """
        Select a recommended exact score without changing the raw
        Poisson most_likely_score.

        When the 1X2 market shows a sufficiently clear outcome, choose
        the highest-probability exact score consistent with that outcome.
        For close matches, preserve the raw Poisson top score.
        """

        outcome_probabilities = {
            "home_win": float(home_win),
            "draw": float(draw),
            "away_win": float(away_win),
        }

        ordered_outcomes = sorted(
            outcome_probabilities.items(),
            key=lambda item: item[1],
            reverse=True,
        )

        strongest_outcome, strongest_probability = (
            ordered_outcomes[0]
        )
        second_probability = ordered_outcomes[1][1]
        probability_margin = (
            strongest_probability - second_probability
        )

        # Only override the raw Poisson score when the overall match
        # outcome has a clear statistical advantage.
        has_clear_outcome = (
            strongest_probability >= 50.0
            and probability_margin >= 8.0
        )

        if has_clear_outcome:
            for score_item in top_scores:
                if not isinstance(score_item, dict):
                    continue

                home_goals = score_item.get("home_goals")
                away_goals = score_item.get("away_goals")

                if home_goals is None or away_goals is None:
                    continue

                safe_home = cls._integer(home_goals)
                safe_away = cls._integer(away_goals)

                matches_outcome = (
                    (
                        strongest_outcome == "home_win"
                        and safe_home > safe_away
                    )
                    or (
                        strongest_outcome == "draw"
                        and safe_home == safe_away
                    )
                    or (
                        strongest_outcome == "away_win"
                        and safe_home < safe_away
                    )
                )

                if matches_outcome:
                    score = score_item.get("score")

                    if score is not None and str(score).strip():
                        return str(score).strip()

                    return f"{safe_home}-{safe_away}"

        # Preserve the original mathematical Poisson mode when the
        # match is close or no compatible top-score item is available.
        score = most_likely_score.get("score")

        if score is not None and str(score).strip():
            return str(score).strip()

        home_goals = most_likely_score.get("home_goals")
        away_goals = most_likely_score.get("away_goals")

        if home_goals is None or away_goals is None:
            return None

        return (
            f"{cls._integer(home_goals)}-"
            f"{cls._integer(away_goals)}"
        )
    @staticmethod
    def _best_pick(
        *,
        home_win: float,
        draw: float,
        away_win: float,
        over_2_5: float,
        btts_yes: float,
    ) -> tuple[str, str, float]:
        candidates = {
            "home_win": ("Home Win", home_win),
            "draw": ("Draw", draw),
            "away_win": ("Away Win", away_win),
            "over_2_5": ("Over 2.5 Goals", over_2_5),
            "btts_yes": (
                "Both Teams to Score",
                btts_yes,
            ),
        }

        key = max(
            candidates,
            key=lambda item: candidates[item][1],
        )
        label, probability = candidates[key]

        return key, label, float(probability)

    @classmethod
    def _confidence_label(
        cls,
        confidence: dict[str, Any],
    ) -> str:
        value = cls._first_value(
            confidence.get("label"),
            confidence.get("level"),
            confidence.get("rating"),
            confidence.get("confidence_label"),
        )

        if value is not None:
            return str(value)[:30]

        score = cls._confidence_score(
            confidence=confidence,
            home_win=0.0,
            draw=0.0,
            away_win=0.0,
        )

        if score >= 75:
            return "high"

        if score >= 50:
            return "medium"

        return "low"

    @classmethod
    def _confidence_score(
        cls,
        *,
        confidence: dict[str, Any],
        home_win: float,
        draw: float,
        away_win: float,
    ) -> int:
        raw_score = cls._first_value(
            confidence.get("score"),
            confidence.get("confidence_score"),
            confidence.get("percentage"),
            confidence.get("value"),
        )

        if raw_score is not None:
            score = cls._number(raw_score)

            if 0.0 <= score <= 1.0:
                score *= 100.0

            return max(
                0,
                min(100, int(round(score))),
            )

        probabilities = sorted(
            (home_win, draw, away_win),
            reverse=True,
        )

        if not probabilities:
            return 0

        highest = probabilities[0]
        second = (
            probabilities[1]
            if len(probabilities) > 1
            else 0.0
        )

        margin = max(0.0, highest - second)

        if highest <= 1.0:
            margin *= 100.0

        return max(
            0,
            min(100, int(round(margin))),
        )

    @staticmethod
    def _reset_evaluation(
        record: PredictionRecord,
    ) -> None:
        record.evaluated = False
        record.actual_home_score = None
        record.actual_away_score = None
        record.actual_result = None
        record.result_prediction_correct = None
        record.over_2_5_correct = None
        record.btts_correct = None
        record.exact_score_correct = None
        record.home_goals_error = None
        record.away_goals_error = None

    @staticmethod
    def serialize_record(
        record: PredictionRecord,
    ) -> dict[str, Any]:
        return {
            "id": record.id,
            "match_id": record.match_id,
            "model_version": record.model_version,
            "created_at": record.created_at,
            "expected_goals": {
                "home": record.expected_home_goals,
                "away": record.expected_away_goals,
                "total": record.expected_total_goals,
            },
            "probabilities": {
                "home_win": record.home_win_probability,
                "draw": record.draw_probability,
                "away_win": record.away_win_probability,
                "over_2_5": record.over_2_5_probability,
                "btts": record.btts_probability,
            },
            "predicted_score": record.predicted_score,
            "best_pick": {
                "key": record.best_pick_key,
                "label": record.best_pick_label,
                "probability": (
                    record.best_pick_probability
                ),
            },
            "confidence": {
                "label": record.confidence,
                "score": record.confidence_score,
            },
            "evaluated": record.evaluated,
        }

    @staticmethod
    def _prediction_error_message(
        prediction: dict[str, Any],
    ) -> str:
        error = prediction.get("error")

        if isinstance(error, dict):
            stage = error.get("stage")
            message = error.get("message")

            if stage and message:
                return f"[{stage}] {message}"

            if message:
                return str(message)

        return "Prediction Engine V11 failed."

    @staticmethod
    def _dictionary(
        value: Any,
    ) -> dict[str, Any]:
        if isinstance(value, dict):
            return value

        return {}

    @staticmethod
    def _first_value(
        *values: Any,
    ) -> Any:
        for value in values:
            if value is not None:
                return value

        return None

    @classmethod
    def _first_number(
        cls,
        *values: Any,
        default: float,
    ) -> float:
        for value in values:
            if value is None:
                continue

            try:
                return float(value)
            except (TypeError, ValueError):
                continue

        return float(default)

    @staticmethod
    def _number(
        value: Any,
        default: float = 0.0,
    ) -> float:
        if value is None:
            return float(default)

        try:
            return float(value)
        except (TypeError, ValueError):
            return float(default)

    @staticmethod
    def _integer(
        value: Any,
        default: int = 0,
    ) -> int:
        if value is None:
            return int(default)

        try:
            return int(value)
        except (TypeError, ValueError):
            return int(default)

    @staticmethod
    def _positive_integer(
        value: Any,
        *,
        field_name: str,
    ) -> int:
        try:
            result = int(value)
        except (TypeError, ValueError) as error:
            raise ValueError(
                f"{field_name} must be an integer."
            ) from error

        if result <= 0:
            raise ValueError(
                f"{field_name} must be greater than zero."
            )

        return result

