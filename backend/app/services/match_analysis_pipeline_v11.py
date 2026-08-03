from __future__ import annotations

import inspect
import logging
from time import perf_counter
from typing import Any, TypeVar

from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.services.feature_store_service import FeatureStoreService
from app.services.prediction_tracking_service import (
    PredictionTrackingService,
)
from app.services.prediction_v11_service import PredictionV11Service


logger = logging.getLogger(__name__)

ServiceType = TypeVar("ServiceType")


class MatchAnalysisPipelineV11:
    """
    خط تشغيل مستقل لتحليل مباراة واحدة بواسطة Prediction Engine V11.

    المسؤوليات:
    1. إدارة جلسة قاعدة البيانات.
    2. تشغيل PredictionV11Service.
    3. حفظ الخصائص في Feature Store.
    4. حفظ نتيجة التوقع لأغراض التتبع والتقييم.
    5. تنفيذ commit عند النجاح وrollback عند الفشل.
    6. إدارة الجلسة عند استخدام Context Manager.

    هذا الـPipeline مستقل ولا يعتمد على:
    - MatchAnalysisPipeline القديم
    - PredictionV6Service
    - PredictionV7Service
    """

    DEFAULT_FEATURE_VERSION = "Feature Engineering V11"

    def __init__(
        self,
        db: Session | None = None,
        *,
        max_goals: int = 8,
        top_scores_count: int = 10,
    ) -> None:
        self._owns_session = db is None
        self.db: Session = db if db is not None else SessionLocal()

        self.prediction_service = PredictionV11Service(
            db=self.db,
            max_goals=max_goals,
            top_scores_count=top_scores_count,
        )

        self.feature_store_service = self._create_database_service(
            FeatureStoreService
        )

        self.prediction_tracking_service = self._create_database_service(
            PredictionTrackingService
        )

    def _create_database_service(
        self,
        service_class: type[ServiceType],
    ) -> ServiceType:
        """
        ينشئ خدمة قاعدة البيانات وفق Constructor الفعلي للخدمة.

        يدعم الخدمات التي تستقبل:
        - db
        - session
        - database_session
        - معاملًا موضعيًا واحدًا
        - أو لا تستقبل معاملات مطلوبة
        """

        signature = inspect.signature(service_class)
        parameters = signature.parameters

        if "db" in parameters:
            return service_class(db=self.db)

        if "session" in parameters:
            return service_class(session=self.db)

        if "database_session" in parameters:
            return service_class(database_session=self.db)

        required_parameters = [
            parameter
            for parameter in parameters.values()
            if parameter.default is inspect.Parameter.empty
            and parameter.kind
            in (
                inspect.Parameter.POSITIONAL_ONLY,
                inspect.Parameter.POSITIONAL_OR_KEYWORD,
                inspect.Parameter.KEYWORD_ONLY,
            )
        ]

        if not required_parameters:
            return service_class()

        if len(required_parameters) == 1:
            return service_class(self.db)

        raise TypeError(
            f"تعذر إنشاء الخدمة {service_class.__name__}. "
            f"Constructor غير مدعوم: {signature}"
        )

    def analyze_match(
        self,
        match_id: int,
        *,
        history_limit: int = 5,
        max_goals: int | None = None,
        top_scores_count: int | None = None,
        save_features: bool = True,
        save_prediction: bool = True,
        feature_version: str = DEFAULT_FEATURE_VERSION,
        replace_existing_features: bool = True,
    ) -> dict[str, Any]:
        """
        يشغّل جميع مراحل تحليل المباراة باستخدام V11.

        Parameters
        ----------
        match_id:
            المعرّف المحلي للمباراة في جدول matches.

        history_limit:
            يبقى جزءًا من الواجهة الموحدة للخدمات، بينما يتولى
            PredictionEngineV11 بناء بياناته داخليًا.

        max_goals:
            الحد الأعلى للأهداف المستخدمة في مصفوفة الاحتمالات.

        top_scores_count:
            عدد النتائج الصحيحة الأعلى احتمالًا.

        save_features:
            حفظ الخصائص الناتجة في Feature Store.

        save_prediction:
            حفظ نتيجة التوقع في Prediction Tracking.

        feature_version:
            إصدار هندسة الخصائص المحفوظ.

        replace_existing_features:
            استبدال الخصائص المحفوظة سابقًا للمباراة نفسها.
        """

        if not isinstance(match_id, int) or isinstance(match_id, bool):
            raise TypeError("match_id يجب أن يكون عددًا صحيحًا.")

        if match_id <= 0:
            raise ValueError("match_id يجب أن يكون أكبر من صفر.")

        if (
            not isinstance(history_limit, int)
            or isinstance(history_limit, bool)
        ):
            raise TypeError(
                "history_limit يجب أن يكون عددًا صحيحًا."
            )

        if history_limit <= 0:
            raise ValueError(
                "history_limit يجب أن يكون أكبر من صفر."
            )

        started_at = perf_counter()

        logger.info(
            "بدء Match Analysis Pipeline V11 للمباراة match_id=%s",
            match_id,
        )

        try:
            prediction = self.prediction_service.predict_match(
                match_id=match_id,
                history_limit=history_limit,
                max_goals=max_goals,
                top_scores_count=top_scores_count,
                include_features=True,
                include_score_matrix=False,
                include_raw_data=False,
            )

            if not isinstance(prediction, dict):
                raise TypeError(
                    "PredictionV11Service.predict_match() "
                    "يجب أن يعيد dictionary."
                )

            features = prediction.get("features")

            if not isinstance(features, dict):
                raise RuntimeError(
                    "نتيجة Prediction V11 لا تحتوي على "
                    "features صالحة."
                )

            features_saved = False
            prediction_saved = False

            if save_features:
                self.feature_store_service.save_features(
                    match_id=match_id,
                    features=features,
                    feature_version=feature_version,
                    replace_existing=replace_existing_features,
                )
                features_saved = True

            if save_prediction:
                self.prediction_tracking_service.save_prediction(
                    prediction=prediction,
                    match_id=match_id,
                )
                prediction_saved = True

            self.db.commit()

            elapsed_ms = round(
                (perf_counter() - started_at) * 1000,
                2,
            )

            prediction["pipeline"] = {
                "name": self.__class__.__name__,
                "status": "completed",
                "match_id": match_id,
                "model": prediction.get("model"),
                "history_limit": history_limit,
                "feature_version": feature_version,
                "features_saved": features_saved,
                "prediction_saved": prediction_saved,
                "elapsed_ms": elapsed_ms,
            }

            logger.info(
                "اكتمل Match Analysis Pipeline V11 للمباراة "
                "match_id=%s خلال %s ms",
                match_id,
                elapsed_ms,
            )

            return prediction

        except Exception:
            self.db.rollback()

            logger.exception(
                "فشل Match Analysis Pipeline V11 للمباراة "
                "match_id=%s",
                match_id,
            )

            raise

    def close(self) -> None:
        """
        يغلق جلسة قاعدة البيانات فقط إذا أنشأها الـPipeline بنفسه.
        """

        if self._owns_session:
            self.db.close()

    def __enter__(self) -> "MatchAnalysisPipelineV11":
        return self

    def __exit__(
        self,
        exc_type: Any,
        exc_value: Any,
        traceback: Any,
    ) -> None:
        if exc_type is not None:
            self.db.rollback()

        self.close()
