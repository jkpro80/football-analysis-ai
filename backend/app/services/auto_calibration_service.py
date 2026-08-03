from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import PredictionRecord


class AutoCalibrationService:
    """
    تحليل توقعات النموذج المقيّمة واقتراح
    معاملات معايرة جديدة.

    هذه الخدمة لا تعدّل المحرك تلقائيًا.
    هي تُرجع توصيات آمنة لاختبارها أولًا.
    """

    MODEL_VERSION = "Prediction Engine V3"
    MINIMUM_SAMPLE_SIZE = 30

    def __init__(
        self,
        db: Session,
    ) -> None:
        self.db = db

    @staticmethod
    def clamp(
        value: float,
        minimum: float,
        maximum: float,
    ) -> float:
        """
        حصر القيمة بين حد أدنى وحد أعلى.
        """

        return max(
            minimum,
            min(value, maximum),
        )

    @staticmethod
    def average(
        values: list[float],
    ) -> float:
        """
        حساب المتوسط بأمان.
        """

        if not values:
            return 0.0

        return sum(values) / len(values)

    @staticmethod
    def percentage(
        correct: int,
        total: int,
    ) -> float:
        """
        حساب النسبة المئوية.
        """

        if total <= 0:
            return 0.0

        return round(
            correct / total * 100,
            2,
        )

    def get_evaluated_records(
        self,
        model_version: str | None = None,
        limit: int | None = None,
    ) -> list[PredictionRecord]:
        """
        جلب توقعات النموذج التي تم تقييمها.
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
                PredictionRecord.actual_home_score
                .is_not(None),
                PredictionRecord.actual_away_score
                .is_not(None),
            )
            .order_by(
                PredictionRecord.id.desc()
            )
        )

        if limit is not None:
            safe_limit = max(
                1,
                min(limit, 1000),
            )

            statement = statement.limit(
                safe_limit
            )

        return list(
            self.db.scalars(
                statement
            ).all()
        )

    def calculate_accuracy(
        self,
        records: list[PredictionRecord],
    ) -> dict[str, float]:
        """
        حساب دقة الأسواق الأساسية.
        """

        total = len(records)

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

        return {
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
        }

    def calculate_goal_averages(
        self,
        records: list[PredictionRecord],
    ) -> dict[str, float]:
        """
        مقارنة متوسط الأهداف المتوقعة
        بمتوسط الأهداف الفعلية.
        """

        predicted_home = [
            float(
                record.expected_home_goals
            )
            for record in records
        ]

        predicted_away = [
            float(
                record.expected_away_goals
            )
            for record in records
        ]

        predicted_total = [
            float(
                record.expected_total_goals
            )
            for record in records
        ]

        actual_home = [
            float(
                record.actual_home_score
            )
            for record in records
        ]

        actual_away = [
            float(
                record.actual_away_score
            )
            for record in records
        ]

        actual_total = [
            float(
                record.actual_home_score
                + record.actual_away_score
            )
            for record in records
        ]

        return {
            "predicted_home": round(
                self.average(
                    predicted_home
                ),
                3,
            ),
            "actual_home": round(
                self.average(
                    actual_home
                ),
                3,
            ),
            "predicted_away": round(
                self.average(
                    predicted_away
                ),
                3,
            ),
            "actual_away": round(
                self.average(
                    actual_away
                ),
                3,
            ),
            "predicted_total": round(
                self.average(
                    predicted_total
                ),
                3,
            ),
            "actual_total": round(
                self.average(
                    actual_total
                ),
                3,
            ),
        }

    def calculate_mean_absolute_errors(
        self,
        records: list[PredictionRecord],
    ) -> dict[str, float]:
        """
        حساب متوسط الخطأ المطلق للأهداف.
        """

        home_errors = [
            float(
                record.home_goals_error
            )
            for record in records
            if (
                record.home_goals_error
                is not None
            )
        ]

        away_errors = [
            float(
                record.away_goals_error
            )
            for record in records
            if (
                record.away_goals_error
                is not None
            )
        ]

        total_errors = [
            float(
                record.total_goals_error
            )
            for record in records
            if (
                record.total_goals_error
                is not None
            )
        ]

        return {
            "home_goals": round(
                self.average(
                    home_errors
                ),
                3,
            ),
            "away_goals": round(
                self.average(
                    away_errors
                ),
                3,
            ),
            "total_goals": round(
                self.average(
                    total_errors
                ),
                3,
            ),
        }

    def calculate_result_distribution(
        self,
        records: list[PredictionRecord],
    ) -> dict[str, Any]:
        """
        مقارنة توزيع النتائج المتوقعة
        بتوزيع النتائج الفعلية.
        """

        total = len(records)

        predicted_counts = {
            "home_win": 0,
            "draw": 0,
            "away_win": 0,
        }

        actual_counts = {
            "home_win": 0,
            "draw": 0,
            "away_win": 0,
        }

        for record in records:
            predicted_probabilities = {
                "home_win": float(
                    record.home_win_probability
                ),
                "draw": float(
                    record.draw_probability
                ),
                "away_win": float(
                    record.away_win_probability
                ),
            }

            predicted_result = max(
                predicted_probabilities,
                key=predicted_probabilities.get,
            )

            predicted_counts[
                predicted_result
            ] += 1

            actual_result = str(
                record.actual_result
            )

            if actual_result in actual_counts:
                actual_counts[
                    actual_result
                ] += 1

        return {
            "predicted": {
                key: {
                    "count": value,
                    "percentage": (
                        self.percentage(
                            value,
                            total,
                        )
                    ),
                }
                for key, value
                in predicted_counts.items()
            },
            "actual": {
                key: {
                    "count": value,
                    "percentage": (
                        self.percentage(
                            value,
                            total,
                        )
                    ),
                }
                for key, value
                in actual_counts.items()
            },
        }

    def calculate_recommendations(
        self,
        goal_averages: dict[str, float],
        result_distribution: dict[str, Any],
    ) -> dict[str, Any]:
        """
        اقتراح معاملات معايرة محدودة وآمنة.
        """

        predicted_home = max(
            goal_averages[
                "predicted_home"
            ],
            0.20,
        )

        predicted_away = max(
            goal_averages[
                "predicted_away"
            ],
            0.20,
        )

        predicted_total = max(
            goal_averages[
                "predicted_total"
            ],
            0.40,
        )

        actual_home = goal_averages[
            "actual_home"
        ]

        actual_away = goal_averages[
            "actual_away"
        ]

        actual_total = goal_averages[
            "actual_total"
        ]

        home_goal_multiplier = (
            actual_home / predicted_home
        )

        away_goal_multiplier = (
            actual_away / predicted_away
        )

        total_goal_multiplier = (
            actual_total / predicted_total
        )

        home_goal_multiplier = self.clamp(
            home_goal_multiplier,
            0.90,
            1.10,
        )

        away_goal_multiplier = self.clamp(
            away_goal_multiplier,
            0.90,
            1.10,
        )

        total_goal_multiplier = self.clamp(
            total_goal_multiplier,
            0.90,
            1.10,
        )

        predicted_home_win = float(
            result_distribution[
                "predicted"
            ]["home_win"]["percentage"]
        )

        actual_home_win = float(
            result_distribution[
                "actual"
            ]["home_win"]["percentage"]
        )

        home_win_difference = (
            actual_home_win
            - predicted_home_win
        )

        home_advantage_multiplier = (
            1.0
            + home_win_difference / 500
        )

        home_advantage_multiplier = (
            self.clamp(
                home_advantage_multiplier,
                0.95,
                1.05,
            )
        )

        attack_multiplier = round(
            (
                home_goal_multiplier
                + away_goal_multiplier
                + total_goal_multiplier
            )
            / 3,
            4,
        )

        return {
            "home_goal_multiplier": round(
                home_goal_multiplier,
                4,
            ),
            "away_goal_multiplier": round(
                away_goal_multiplier,
                4,
            ),
            "total_goal_multiplier": round(
                total_goal_multiplier,
                4,
            ),
            "attack_multiplier": (
                attack_multiplier
            ),
            "home_advantage_multiplier": round(
                home_advantage_multiplier,
                4,
            ),
            "recommended_limits": {
                "minimum_multiplier": 0.90,
                "maximum_multiplier": 1.10,
                "minimum_home_advantage": 0.95,
                "maximum_home_advantage": 1.05,
            },
        }

    def calibrate(
        self,
        model_version: str | None = None,
        limit: int | None = None,
    ) -> dict[str, Any]:
        """
        إنشاء تقرير المعايرة الكامل.

        لا يتم تطبيق التوصيات تلقائيًا.
        """

        selected_model = (
            model_version
            or self.MODEL_VERSION
        )

        records = self.get_evaluated_records(
            model_version=selected_model,
            limit=limit,
        )

        sample_size = len(records)

        if (
            sample_size
            < self.MINIMUM_SAMPLE_SIZE
        ):
            return {
                "model_version": (
                    selected_model
                ),
                "sample_size": sample_size,
                "minimum_required": (
                    self.MINIMUM_SAMPLE_SIZE
                ),
                "calibration_ready": False,
                "applied": False,
                "message": (
                    "Not enough evaluated "
                    "predictions for calibration."
                ),
            }

        accuracy = self.calculate_accuracy(
            records
        )

        goal_averages = (
            self.calculate_goal_averages(
                records
            )
        )

        mean_absolute_error = (
            self.calculate_mean_absolute_errors(
                records
            )
        )

        result_distribution = (
            self.calculate_result_distribution(
                records
            )
        )

        recommendations = (
            self.calculate_recommendations(
                goal_averages=goal_averages,
                result_distribution=(
                    result_distribution
                ),
            )
        )

        return {
            "model_version": selected_model,
            "sample_size": sample_size,
            "minimum_required": (
                self.MINIMUM_SAMPLE_SIZE
            ),
            "calibration_ready": True,
            "applied": False,
            "accuracy": accuracy,
            "goal_averages": goal_averages,
            "mean_absolute_error": (
                mean_absolute_error
            ),
            "result_distribution": (
                result_distribution
            ),
            "recommendations": (
                recommendations
            ),
            "message": (
                "Calibration recommendations "
                "were generated but not applied."
            ),
        }