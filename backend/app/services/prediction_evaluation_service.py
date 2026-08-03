from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    Match,
    PredictionRecord,
)


class PredictionEvaluationService:
    """
    مقارنة توقعات V3 بالنتائج الفعلية
    وتخزين مؤشرات الدقة.
    """

    DEFAULT_MODEL_VERSION = "Prediction Engine V3"

    def __init__(
        self,
        db: Session,
        model_version: str | None = None,
    ) -> None:
        self.db = db
        self.model_version = (
            str(model_version).strip()
            if model_version is not None
            and str(model_version).strip()
            else self.DEFAULT_MODEL_VERSION
        )

    def get_match(
        self,
        match_id: int,
    ) -> Match:
        """
        جلب مباراة من قاعدة البيانات.
        """

        match = self.db.get(
            Match,
            match_id,
        )

        if match is None:
            raise ValueError(
                "Match not found."
            )

        return match

    def get_prediction_record(
        self,
        match_id: int,
    ) -> PredictionRecord:
        """
        جلب أحدث سجل توقع V3 للمباراة.
        """

        statement = (
            select(PredictionRecord)
            .where(
                PredictionRecord.match_id
                == match_id,
                PredictionRecord.model_version
                == self.model_version,
            )
            .order_by(
                PredictionRecord.id.desc()
            )
        )

        record = self.db.scalar(
            statement
        )

        if record is None:
            raise ValueError(
                "Prediction record was not found."
            )

        return record

    @staticmethod
    def get_actual_result(
        home_score: int,
        away_score: int,
    ) -> str:
        """
        تحويل النتيجة الفعلية إلى:
        home_win أو draw أو away_win.
        """

        if home_score > away_score:
            return "home_win"

        if home_score < away_score:
            return "away_win"

        return "draw"

    @staticmethod
    def get_predicted_result(
        record: PredictionRecord,
    ) -> str:
        """
        تحديد نتيجة المباراة المتوقعة
        حسب أعلى احتمال من أسواق 1X2.
        """

        probabilities = {
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

        return max(
            probabilities,
            key=probabilities.get,
        )

    @staticmethod
    def parse_predicted_score(
        predicted_score: str | None,
    ) -> tuple[int, int] | None:
        """
        تحويل النص مثل 2-1 إلى رقمين.
        """

        if not predicted_score:
            return None

        parts = predicted_score.split(
            "-"
        )

        if len(parts) != 2:
            return None

        try:
            return (
                int(parts[0].strip()),
                int(parts[1].strip()),
            )

        except ValueError:
            return None

    def evaluate_prediction(
        self,
        match_id: int,
        force: bool = False,
    ) -> dict[str, Any]:
        """
        تقييم توقع مباراة واحدة.

        force=False يمنع إعادة التقييم
        إذا كان السجل مقيّمًا مسبقًا.
        """

        match = self.get_match(
            match_id
        )

        if str(match.status).strip().lower() not in {"5", "finished", "ft"}:
            raise ValueError(
                "Match is not finished."
            )

        if (
            match.home_score is None
            or match.away_score is None
        ):
            raise ValueError(
                "Finished match has no final score."
            )

        record = self.get_prediction_record(
            match_id
        )

        if record.evaluated and not force:
            return self.serialize_result(
                record=record,
                already_evaluated=True,
            )

        actual_home_score = int(
            match.home_score
        )

        actual_away_score = int(
            match.away_score
        )

        actual_total_goals = (
            actual_home_score
            + actual_away_score
        )

        actual_result = (
            self.get_actual_result(
                home_score=actual_home_score,
                away_score=actual_away_score,
            )
        )

        predicted_result = (
            self.get_predicted_result(
                record
            )
        )

        predicted_over_2_5 = (
            float(
                record.over_2_5_probability
            )
            >= 50.0
        )

        actual_over_2_5 = (
            actual_total_goals > 2
        )

        predicted_btts = (
            float(
                record.btts_probability
            )
            >= 50.0
        )

        actual_btts = (
            actual_home_score > 0
            and actual_away_score > 0
        )

        predicted_score = (
            self.parse_predicted_score(
                record.predicted_score
            )
        )

        exact_score_correct = False

        if predicted_score is not None:
            exact_score_correct = (
                predicted_score[0]
                == actual_home_score
                and predicted_score[1]
                == actual_away_score
            )

        record.actual_home_score = (
            actual_home_score
        )

        record.actual_away_score = (
            actual_away_score
        )

        record.actual_result = (
            actual_result
        )

        record.result_prediction_correct = (
            predicted_result
            == actual_result
        )

        record.over_2_5_correct = (
            predicted_over_2_5
            == actual_over_2_5
        )

        record.btts_correct = (
            predicted_btts
            == actual_btts
        )

        record.exact_score_correct = (
            exact_score_correct
        )

        record.home_goals_error = round(
            abs(
                float(
                    record.expected_home_goals
                )
                - actual_home_score
            ),
            3,
        )

        record.away_goals_error = round(
            abs(
                float(
                    record.expected_away_goals
                )
                - actual_away_score
            ),
            3,
        )

        record.total_goals_error = round(
            abs(
                float(
                    record.expected_total_goals
                )
                - actual_total_goals
            ),
            3,
        )

        record.evaluated = True

        try:
            self.db.commit()
            self.db.refresh(record)

        except Exception:
            self.db.rollback()
            raise

        return self.serialize_result(
            record=record,
            already_evaluated=False,
        )

    def evaluate_all_finished_matches(
        self,
    ) -> dict[str, Any]:
        """
        تقييم جميع سجلات V3 غير المقيّمة
        التي انتهت مبارياتها.
        """

        statement = (
            select(PredictionRecord)
            .join(
                Match,
                Match.id
                == PredictionRecord.match_id,
            )
            .where(
                PredictionRecord.model_version
                == self.model_version,
                PredictionRecord.evaluated
                .is_(False),
                Match.status.in_(("5", "finished", "ft")),
                Match.home_score.is_not(None),
                Match.away_score.is_not(None),
            )
            .order_by(
                PredictionRecord.id
            )
        )

        records = list(
            self.db.scalars(
                statement
            ).all()
        )

        evaluated = 0
        failed = 0
        errors: list[dict[str, Any]] = []

        for record in records:
            try:
                self.evaluate_prediction(
                    match_id=record.match_id
                )

                evaluated += 1

            except Exception as error:
                failed += 1

                errors.append(
                    {
                        "match_id": (
                            record.match_id
                        ),
                        "error": str(error),
                    }
                )

        return {
            "found": len(records),
            "evaluated": evaluated,
            "failed": failed,
            "errors": errors,
        }

    @staticmethod
    def serialize_result(
        record: PredictionRecord,
        already_evaluated: bool,
    ) -> dict[str, Any]:
        """
        تحويل نتيجة التقييم إلى قاموس واضح.
        """

        predicted_result = (
            PredictionEvaluationService
            .get_predicted_result(record)
        )

        return {
            "prediction_record_id": (
                record.id
            ),
            "match_id": record.match_id,
            "model_version": (
                record.model_version
            ),
            "evaluated": record.evaluated,
            "already_evaluated": (
                already_evaluated
            ),
            "actual_score": (
                f"{record.actual_home_score}-"
                f"{record.actual_away_score}"
            ),
            "predicted_score": (
                record.predicted_score
            ),
            "actual_result": (
                record.actual_result
            ),
            "predicted_result": (
                predicted_result
            ),
            "result_prediction_correct": (
                record.result_prediction_correct
            ),
            "over_2_5_correct": (
                record.over_2_5_correct
            ),
            "btts_correct": (
                record.btts_correct
            ),
            "exact_score_correct": (
                record.exact_score_correct
            ),
            "errors": {
                "home_goals": (
                    record.home_goals_error
                ),
                "away_goals": (
                    record.away_goals_error
                ),
                "total_goals": (
                    record.total_goals_error
                ),
            },
        }


