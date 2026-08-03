from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.engine.prediction_engine_v11 import PredictionEngineV11


class PredictionV11Service:
    """
    طبقة خدمة مستقلة لتشغيل PredictionEngineV11.

    المسؤوليات:
    - إنشاء محرك V11 باستخدام جلسة SQLAlchemy الحالية.
    - توحيد إعدادات max_goals وtop_scores_count.
    - طلب Features عند استخدام المحرك داخل Pipeline.
    - إضافة بيانات تعريف متوافقة مع أنظمة التتبع.
    - عدم إضافة أو تعديل أي منطق رياضي خاص بالتوقع.
    """

    MODEL_NAME = PredictionEngineV11.MODEL_NAME
    MODEL_VERSION = PredictionEngineV11.VERSION

    def __init__(
        self,
        db: Session,
        *,
        max_goals: int = 8,
        top_scores_count: int = 10,
    ) -> None:
        if db is None:
            raise ValueError("يجب تمرير جلسة قاعدة البيانات db.")

        self.db = db
        self.max_goals = self._bounded_integer(
            value=max_goals,
            minimum=1,
            maximum=20,
            field_name="max_goals",
        )
        self.top_scores_count = self._bounded_integer(
            value=top_scores_count,
            minimum=1,
            maximum=100,
            field_name="top_scores_count",
        )

        self.engine = PredictionEngineV11(db=self.db)

    def predict_match(
        self,
        match_id: int,
        *,
        history_limit: int = 5,
        max_goals: int | None = None,
        top_scores_count: int | None = None,
        include_features: bool = True,
        include_score_matrix: bool = False,
        include_raw_data: bool = False,
    ) -> dict[str, Any]:
        """
        يشغّل PredictionEngineV11 لمباراة واحدة.

        history_limit موجود لتوحيد واجهة الاستدعاء مع بقية خدمات
        المشروع، لكنه لا يغيّر منطق V11 لأن المحرك يبني بياناته
        وخصائصه داخليًا.
        """

        safe_match_id = self._positive_integer(
            value=match_id,
            field_name="match_id",
        )
        safe_history_limit = self._bounded_integer(
            value=history_limit,
            minimum=1,
            maximum=20,
            field_name="history_limit",
        )

        resolved_max_goals = (
            self.max_goals
            if max_goals is None
            else self._bounded_integer(
                value=max_goals,
                minimum=1,
                maximum=20,
                field_name="max_goals",
            )
        )

        resolved_top_scores_count = (
            self.top_scores_count
            if top_scores_count is None
            else self._bounded_integer(
                value=top_scores_count,
                minimum=1,
                maximum=100,
                field_name="top_scores_count",
            )
        )

        prediction = self.engine.predict(
            match_id=safe_match_id,
            max_goals=resolved_max_goals,
            top_scores_count=resolved_top_scores_count,
            include_features=include_features,
            include_score_matrix=include_score_matrix,
            include_raw_data=include_raw_data,
        )

        if not isinstance(prediction, dict):
            raise TypeError(
                "PredictionEngineV11.predict() يجب أن يعيد dictionary."
            )

        if prediction.get("success") is not True:
            raise RuntimeError(
                "PredictionEngineV11 لم يعِد نتيجة ناجحة."
            )

        if include_features and not isinstance(
            prediction.get("features"),
            dict,
        ):
            raise RuntimeError(
                "نتيجة Prediction V11 لا تحتوي على features صالحة."
            )

        engine_metadata = prediction.get("engine")

        if not isinstance(engine_metadata, dict):
            engine_metadata = {}

        prediction["model"] = (
            f"{engine_metadata.get('name', self.MODEL_NAME)} "
            f"{engine_metadata.get('version', self.MODEL_VERSION)}"
        ).strip()

        prediction["service"] = {
            "name": self.__class__.__name__,
            "model_name": self.MODEL_NAME,
            "model_version": self.MODEL_VERSION,
            "history_limit": safe_history_limit,
            "max_goals": resolved_max_goals,
            "top_scores_count": resolved_top_scores_count,
        }

        return prediction

    @staticmethod
    def _positive_integer(
        value: Any,
        field_name: str,
    ) -> int:
        if isinstance(value, bool):
            raise TypeError(
                f"{field_name} يجب أن يكون عددًا صحيحًا."
            )

        try:
            resolved = int(value)
        except (TypeError, ValueError) as exc:
            raise TypeError(
                f"{field_name} يجب أن يكون عددًا صحيحًا."
            ) from exc

        if resolved <= 0:
            raise ValueError(
                f"{field_name} يجب أن يكون أكبر من صفر."
            )

        return resolved

    @classmethod
    def _bounded_integer(
        cls,
        value: Any,
        minimum: int,
        maximum: int,
        field_name: str,
    ) -> int:
        resolved = cls._positive_integer(
            value=value,
            field_name=field_name,
        )

        if resolved < minimum or resolved > maximum:
            raise ValueError(
                f"{field_name} يجب أن يكون بين "
                f"{minimum} و{maximum}."
            )

        return resolved
