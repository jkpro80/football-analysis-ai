from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import (
    Match,
    PredictionRecord,
)
from app.engine.prediction_engine_v3 import (
    PredictionEngineV3,
)
from app.services.prediction_evaluation_service import (
    PredictionEvaluationService,
)


class BacktestService:
    """
    تشغيل Prediction Engine V3 على مباريات
    قديمة منتهية، ثم تقييم النتائج تلقائيًا.

    يعتمد المحرك على البيانات السابقة لتاريخ
    كل مباراة فقط، لذلك لا يستخدم نتيجة المباراة
    نفسها داخل التوقع.
    """

    MODEL_VERSION = "Prediction Engine V3"

    def __init__(
        self,
        db: Session,
    ) -> None:
        self.db = db
        self.engine = PredictionEngineV3(db)
        self.evaluation_service = (
            PredictionEvaluationService(db)
        )

    def get_existing_record(
        self,
        match_id: int,
    ) -> PredictionRecord | None:
        """
        البحث عن سجل توقع موجود للمباراة
        ولنفس إصدار النموذج.
        """

        statement = (
            select(PredictionRecord)
            .where(
                PredictionRecord.match_id
                == match_id,
                PredictionRecord.model_version
                == self.MODEL_VERSION,
            )
            .order_by(
                PredictionRecord.id.desc()
            )
        )

        return self.db.scalar(statement)

    def get_finished_matches(
        self,
        limit: int = 30,
        before_date: str | None = None,
        after_date: str | None = None,
    ) -> list[Match]:
        """
        جلب مباريات منتهية صالحة للاختبار.
        """

        safe_limit = max(
            1,
            min(limit, 500),
        )

        statement = (
            select(Match)
            .where(
                Match.status == "finished",
                Match.home_score.is_not(None),
                Match.away_score.is_not(None),
            )
        )

        if before_date:
            statement = statement.where(
                Match.date < before_date
            )

        if after_date:
            statement = statement.where(
                Match.date >= after_date
            )

        statement = (
            statement
            .order_by(
                Match.date.asc(),
                Match.id.asc(),
            )
            .limit(safe_limit)
        )

        return list(
            self.db.scalars(
                statement
            ).all()
        )

    def create_prediction_record(
        self,
        match: Match,
    ) -> PredictionRecord:
        """
        تشغيل V3 وحفظ سجل التوقع.
        """

        prediction = self.engine.predict_match(
            match.id
        )

        record = PredictionRecord(
            match_id=match.id,
            model_version=prediction["model"],
            expected_home_goals=prediction[
                "expected_goals"
            ]["home"],
            expected_away_goals=prediction[
                "expected_goals"
            ]["away"],
            expected_total_goals=prediction[
                "expected_goals"
            ]["total"],
            home_win_probability=prediction[
                "probabilities"
            ]["home_win"],
            draw_probability=prediction[
                "probabilities"
            ]["draw"],
            away_win_probability=prediction[
                "probabilities"
            ]["away_win"],
            over_2_5_probability=prediction[
                "over_under"
            ]["over_2_5"],
            btts_probability=prediction[
                "btts"
            ]["yes"],
            predicted_score=prediction[
                "likely_scores"
            ][0]["score"],
            best_pick_key=prediction[
                "best_pick"
            ]["key"],
            best_pick_label=prediction[
                "best_pick"
            ]["label"],
            best_pick_probability=prediction[
                "best_pick"
            ]["probability"],
            confidence=prediction[
                "confidence"
            ],
            confidence_score=prediction[
                "confidence_score"
            ],
        )

        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        return record

    def run_backtest(
        self,
        limit: int = 30,
        before_date: str | None = None,
        after_date: str | None = None,
        skip_existing: bool = True,
    ) -> dict[str, Any]:
        """
        إنشاء وتقييم توقعات لمجموعة مباريات قديمة.
        """

        matches = self.get_finished_matches(
            limit=limit,
            before_date=before_date,
            after_date=after_date,
        )

        created = 0
        evaluated = 0
        skipped = 0
        failed = 0

        results: list[dict[str, Any]] = []
        errors: list[dict[str, Any]] = []

        for match in matches:
            try:
                existing_record = (
                    self.get_existing_record(
                        match.id
                    )
                )

                if (
                    existing_record is not None
                    and skip_existing
                ):
                    skipped += 1

                    if not existing_record.evaluated:
                        evaluation = (
                            self.evaluation_service
                            .evaluate_prediction(
                                match.id
                            )
                        )

                        evaluated += 1

                        results.append(
                            {
                                "match_id": match.id,
                                "record_id": (
                                    existing_record.id
                                ),
                                "created": False,
                                "evaluated": True,
                                "evaluation": (
                                    evaluation
                                ),
                            }
                        )

                    continue

                if (
                    existing_record is not None
                    and not skip_existing
                ):
                    self.db.delete(
                        existing_record
                    )
                    self.db.commit()

                record = (
                    self.create_prediction_record(
                        match
                    )
                )

                created += 1

                evaluation = (
                    self.evaluation_service
                    .evaluate_prediction(
                        match.id
                    )
                )

                evaluated += 1

                results.append(
                    {
                        "match_id": match.id,
                        "record_id": record.id,
                        "created": True,
                        "evaluated": True,
                        "evaluation": evaluation,
                    }
                )

            except Exception as error:
                self.db.rollback()

                failed += 1

                errors.append(
                    {
                        "match_id": match.id,
                        "date": match.date,
                        "error": str(error),
                    }
                )

        return {
            "requested_limit": limit,
            "matches_found": len(matches),
            "created": created,
            "evaluated": evaluated,
            "skipped": skipped,
            "failed": failed,
            "results": results,
            "errors": errors,
        }