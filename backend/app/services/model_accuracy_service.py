from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import PredictionRecord


class ModelAccuracyService:
    """
    حساب أداء نموذج التوقعات اعتمادًا
    على السجلات التي تم تقييمها.
    """

    MODEL_VERSION = "Prediction Engine V3"

    def __init__(
        self,
        db: Session,
    ) -> None:
        self.db = db

    def get_evaluated_records(
        self,
        model_version: str | None = None,
    ) -> list[PredictionRecord]:
        """
        جلب سجلات التوقعات المقيّمة.
        """

        selected_model = (
            model_version
            or self.MODEL_VERSION
        )

        statement = (
            select(PredictionRecord)
            .where(
                PredictionRecord.model_version
                == selected_model,
                PredictionRecord.evaluated
                .is_(True),
            )
            .order_by(
                PredictionRecord.id
            )
        )

        return list(
            self.db.scalars(
                statement
            ).all()
        )

    @staticmethod
    def percentage(
        correct: int,
        total: int,
    ) -> float:
        """
        حساب النسبة المئوية بأمان.
        """

        if total <= 0:
            return 0.0

        return round(
            correct / total * 100,
            2,
        )

    @staticmethod
    def average(
        values: list[float],
    ) -> float:
        """
        حساب المتوسط.
        """

        if not values:
            return 0.0

        return round(
            sum(values) / len(values),
            3,
        )

    @staticmethod
    def get_confidence_group(
        record: PredictionRecord,
    ) -> str:
        """
        تحديد فئة الثقة بطريقة موحدة.
        """

        confidence = str(
            record.confidence or "unknown"
        ).lower()

        if confidence in {
            "high",
            "medium",
            "low",
        }:
            return confidence

        return "unknown"

    def build_confidence_report(
        self,
        records: list[PredictionRecord],
    ) -> dict[str, Any]:
        """
        قياس دقة النتيجة حسب مستوى الثقة.
        """

        groups: dict[str, dict[str, int]] = {
            "high": {
                "total": 0,
                "correct": 0,
            },
            "medium": {
                "total": 0,
                "correct": 0,
            },
            "low": {
                "total": 0,
                "correct": 0,
            },
            "unknown": {
                "total": 0,
                "correct": 0,
            },
        }

        for record in records:
            group = self.get_confidence_group(
                record
            )

            groups[group]["total"] += 1

            if (
                record.result_prediction_correct
                is True
            ):
                groups[group]["correct"] += 1

        result: dict[str, Any] = {}

        for group, values in groups.items():
            total = values["total"]
            correct = values["correct"]

            result[group] = {
                "total": total,
                "correct": correct,
                "accuracy": self.percentage(
                    correct,
                    total,
                ),
            }

        return result

    def get_accuracy_report(
        self,
        model_version: str | None = None,
    ) -> dict[str, Any]:
        """
        إنشاء تقرير كامل لدقة النموذج.
        """

        selected_model = (
            model_version
            or self.MODEL_VERSION
        )

        records = self.get_evaluated_records(
            selected_model
        )

        total = len(records)

        if total == 0:
            return {
                "model_version": (
                    selected_model
                ),
                "evaluated_predictions": 0,
                "message": (
                    "No evaluated predictions "
                    "are available."
                ),
            }

        result_correct = sum(
            1
            for record in records
            if (
                record.result_prediction_correct
                is True
            )
        )

        over_2_5_correct = sum(
            1
            for record in records
            if record.over_2_5_correct is True
        )

        btts_correct = sum(
            1
            for record in records
            if record.btts_correct is True
        )

        exact_score_correct = sum(
            1
            for record in records
            if (
                record.exact_score_correct
                is True
            )
        )

        home_goal_errors = [
            float(record.home_goals_error)
            for record in records
            if record.home_goals_error
            is not None
        ]

        away_goal_errors = [
            float(record.away_goals_error)
            for record in records
            if record.away_goals_error
            is not None
        ]

        total_goal_errors = [
            float(record.total_goals_error)
            for record in records
            if record.total_goals_error
            is not None
        ]

        confidence_scores = [
            float(record.confidence_score)
            for record in records
            if record.confidence_score
            is not None
        ]

        sample_status = "insufficient"

        if total >= 100:
            sample_status = "strong"

        elif total >= 30:
            sample_status = "usable"

        elif total >= 10:
            sample_status = "limited"

        return {
            "model_version": selected_model,
            "evaluated_predictions": total,
            "sample_status": sample_status,
            "accuracy": {
                "match_result": self.percentage(
                    result_correct,
                    total,
                ),
                "over_2_5": self.percentage(
                    over_2_5_correct,
                    total,
                ),
                "btts": self.percentage(
                    btts_correct,
                    total,
                ),
                "exact_score": self.percentage(
                    exact_score_correct,
                    total,
                ),
            },
            "correct_counts": {
                "match_result": result_correct,
                "over_2_5": over_2_5_correct,
                "btts": btts_correct,
                "exact_score": (
                    exact_score_correct
                ),
            },
            "mean_absolute_error": {
                "home_goals": self.average(
                    home_goal_errors
                ),
                "away_goals": self.average(
                    away_goal_errors
                ),
                "total_goals": self.average(
                    total_goal_errors
                ),
            },
            "average_confidence_score": (
                self.average(
                    confidence_scores
                )
            ),
            "accuracy_by_confidence": (
                self.build_confidence_report(
                    records
                )
            ),
            "calibration_ready": (
                total >= 30
            ),
        }