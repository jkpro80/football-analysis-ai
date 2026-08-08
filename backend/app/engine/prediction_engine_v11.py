from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.services.prediction_data_service import PredictionDataService
from app.services.feature_engineering import FeatureEngineering
from app.services.fixture_context_analyzer import (
    FixtureContextAnalyzer,
)
from app.services.match_fatigue_analyzer import (
    MatchFatigueAnalyzer,
)
from app.services.expected_goals_calculator import ExpectedGoalsCalculator
from app.services.poisson_engine import PoissonEngine
from app.engine.match_events_engine import MatchEventsEngine
from app.services.confidence_engine import ConfidenceEngine
from app.services.score_distribution_analyzer import (
    ScoreDistributionAnalyzer,
)


class PredictionEngineV11:
    """
    المحرك الرئيسي لتوقع المباريات.

    يتطلب Session من SQLAlchemy عند الإنشاء:

        engine = PredictionEngineV11(db)
        result = engine.predict(match_id=1)
    """

    VERSION = "11.4.0"
    MODEL_NAME = "Prediction Engine V11"

    def __init__(
        self,
        db: Session,
        data_service: Optional[PredictionDataService] = None,
        feature_engineering: Optional[FeatureEngineering] = None,
    ) -> None:
        if db is None:
            raise ValueError("يجب تمرير جلسة قاعدة البيانات db.")

        self.db = db
        self.data_service = data_service or PredictionDataService(db)
        self.feature_engineering = feature_engineering or FeatureEngineering()

    def predict(
        self,
        match_id: int,
        max_goals: int = 8,
        top_scores_count: int = 10,
        include_features: bool = False,
        include_score_matrix: bool = False,
        include_raw_data: bool = False,
    ) -> Dict[str, Any]:
        """
        ينفذ دورة التوقع الكاملة لمباراة واحدة.
        """

        validated_match_id = self._validate_match_id(match_id)

        try:
            raw_data = self.data_service.get_match_data(validated_match_id)
        except Exception as exc:
            raise PredictionEngineError(
                stage="data_loading",
                message=f"تعذر تحميل بيانات المباراة {validated_match_id}: {exc}",
            ) from exc

        if not raw_data:
            raise MatchNotFoundError(validated_match_id)

        try:
            features = self.feature_engineering.build(raw_data)
        except Exception as exc:
            raise PredictionEngineError(
                stage="feature_engineering",
                message=f"تعذر إنشاء خصائص المباراة: {exc}",
            ) from exc

        if not isinstance(features, dict):
            raise PredictionEngineError(
                stage="feature_engineering",
                message="FeatureEngineering.build يجب أن يعيد قاموسًا.",
            )

        context_analysis = None

        try:
            context_analysis = FixtureContextAnalyzer(
                db=self.db
            ).analyze(
                fixture_id=validated_match_id
            )

            context_features = context_analysis.get(
                "features",
                {},
            )

            if isinstance(context_features, dict):
                features.update(context_features)

            features["fixture_context_available"] = True
            features["fixture_context_warnings"] = (
                context_analysis.get("warnings", [])
            )

        except Exception:
            # Context data is optional. Prediction must remain
            # available when lineups, absences, or weather are missing.
            features.update(
                {
                    "home_availability_factor": 1.0,
                    "away_availability_factor": 1.0,
                    "weather_attack_factor": 1.0,
                    "weather_fatigue_factor": 1.0,
                    "weather_severity": 0.0,
                    "fixture_context_available": False,
                    "fixture_context_warnings": [
                        "Fixture context could not be analyzed."
                    ],
                }
            )

        try:
            fatigue_analysis = MatchFatigueAnalyzer(
                db=self.db
            ).analyze(
                fixture_id=validated_match_id
            )

            fatigue_features = fatigue_analysis.get(
                "features",
                {},
            )

            if isinstance(fatigue_features, dict):
                features.update(fatigue_features)

            features["fatigue_context_available"] = True
            features["fatigue_context_warnings"] = (
                fatigue_analysis.get("warnings", [])
            )

        except Exception:
            # Fatigue context is optional. Missing historical
            # matches must not make the prediction unavailable.
            features.update(
                {
                    "home_rest_days": None,
                    "away_rest_days": None,
                    "home_matches_last_7_days": 0,
                    "away_matches_last_7_days": 0,
                    "home_matches_last_14_days": 0,
                    "away_matches_last_14_days": 0,
                    "home_fatigue_factor": 1.0,
                    "away_fatigue_factor": 1.0,
                    "home_congestion_level": "unknown",
                    "away_congestion_level": "unknown",
                    "rest_advantage_days": None,
                    "fatigue_context_available": False,
                    "fatigue_context_warnings": [
                        "Match fatigue context could not be analyzed."
                    ],
                }
            )

        try:
            expected_goals = ExpectedGoalsCalculator.calculate(features)
        except Exception as exc:
            raise PredictionEngineError(
                stage="expected_goals",
                message=f"تعذر حساب الأهداف المتوقعة: {exc}",
            ) from exc

        home_xg = self._number(
            expected_goals.get("home_expected_goals")
        )
        away_xg = self._number(
            expected_goals.get("away_expected_goals")
        )

        try:
            poisson_result = PoissonEngine.calculate(
                home_expected_goals=home_xg,
                away_expected_goals=away_xg,
                max_goals=max_goals,
                top_scores_count=top_scores_count,
            )
        except Exception as exc:
            raise PredictionEngineError(
                stage="poisson",
                message=f"تعذر حساب احتمالات بواسون: {exc}",
            ) from exc

        try:
            match_events = MatchEventsEngine.calculate(
                features
            )
        except Exception as exc:
            raise PredictionEngineError(
                stage="match_events",
                message=(
                    "تعذر حساب توقعات الركنيات "
                    f"والبطاقات: {exc}"
                ),
            ) from exc

        try:
            confidence = ConfidenceEngine.calculate(
                features=features,
                expected_goals=expected_goals,
                poisson_result=poisson_result,
            )
        except Exception as exc:
            raise PredictionEngineError(
                stage="confidence",
                message=f"تعذر حساب مستوى الثقة: {exc}",
            ) from exc

        try:
            score_distribution = (
                ScoreDistributionAnalyzer.analyze(
                    poisson_result.get(
                        "score_matrix",
                        [],
                    ),
                    predicted_outcome=confidence.get(
                        "predicted_outcome"
                    ),
                    top_limit=top_scores_count,
                )
            )
        except Exception as exc:
            raise PredictionEngineError(
                stage="score_distribution",
                message=(
                    "تعذر تحليل توزيع النتائج الدقيقة: "
                    f"{exc}"
                ),
            ) from exc

        return self._build_response(
            match_id=validated_match_id,
            raw_data=raw_data,
            features=features,
            expected_goals=expected_goals,
            poisson_result=poisson_result,
            match_events=match_events,
            confidence=confidence,
            score_distribution=score_distribution,
            include_features=include_features,
            include_score_matrix=include_score_matrix,
            include_raw_data=include_raw_data,
        )

    def _build_response(
        self,
        match_id: int,
        raw_data: Dict[str, Any],
        features: Dict[str, Any],
        expected_goals: Dict[str, Any],
        poisson_result: Dict[str, Any],
        match_events: Dict[str, Any],
        confidence: Dict[str, Any],
        score_distribution: Dict[str, Any],
        include_features: bool,
        include_score_matrix: bool,
        include_raw_data: bool,
    ) -> Dict[str, Any]:
        match = raw_data.get("match")
        home_team = raw_data.get("home_team")
        away_team = raw_data.get("away_team")

        match_result = poisson_result.get("match_result", {})
        most_likely_score = poisson_result.get(
            "most_likely_score",
            {},
        )

        response: Dict[str, Any] = {
            "success": True,
            "engine": {
                "name": self.MODEL_NAME,
                "version": self.VERSION,
                "generated_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            },
            "match": {
                "id": match_id,
                "date": self._get_value(
                    match,
                    "date",
                    "match_date",
                    "scheduled_at",
                ),
                "status": self._get_value(
                    match,
                    "status",
                ),
                "home_score": self._get_value(
                    match,
                    "home_score",
                ),
                "away_score": self._get_value(
                    match,
                    "away_score",
                ),
                "is_finished": (
                    self._get_value(
                        match,
                        "home_score",
                    )
                    is not None
                    and self._get_value(
                        match,
                        "away_score",
                    )
                    is not None
                ),
                "competition": self._get_value(
                    match,
                    "competition",
                    "league",
                    "tournament",
                ),
                "venue": self._get_value(
                    match,
                    "venue",
                    "stadium",
                ),
                "home_team": self._team_summary(home_team),
                "away_team": self._team_summary(away_team),
                "actual_outcome": (
                    "home_win"
                    if (
                        self._get_value(
                            match,
                            "home_score",
                        )
                        is not None
                        and self._get_value(
                            match,
                            "away_score",
                        )
                        is not None
                        and self._get_value(
                            match,
                            "home_score",
                        )
                        > self._get_value(
                            match,
                            "away_score",
                        )
                    )
                    else "away_win"
                    if (
                        self._get_value(
                            match,
                            "home_score",
                        )
                        is not None
                        and self._get_value(
                            match,
                            "away_score",
                        )
                        is not None
                        and self._get_value(
                            match,
                            "home_score",
                        )
                        < self._get_value(
                            match,
                            "away_score",
                        )
                    )
                    else "draw"
                    if (
                        self._get_value(
                            match,
                            "home_score",
                        )
                        is not None
                        and self._get_value(
                            match,
                            "away_score",
                        )
                        is not None
                    )
                    else None
                ),
            },
            "expected_goals": {
                "home": round(
                    self._number(
                        expected_goals.get(
                            "home_expected_goals"
                        )
                    ),
                    3,
                ),
                "away": round(
                    self._number(
                        expected_goals.get(
                            "away_expected_goals"
                        )
                    ),
                    3,
                ),
                "total": round(
                    self._number(
                        expected_goals.get(
                            "total_expected_goals"
                        )
                    ),
                    3,
                ),
            },
            "prediction": {
                "predicted_outcome": confidence.get(
                    "predicted_outcome"
                ),
                "predicted_outcome_label": confidence.get(
                    "predicted_outcome_label"
                ),
                "home_win": self._number(
                    match_result.get("home_win")
                ),
                "draw": self._number(
                    match_result.get("draw")
                ),
                "away_win": self._number(
                    match_result.get("away_win")
                ),
            },
            "most_likely_score": {
                "score": most_likely_score.get("score"),
                "home_goals": most_likely_score.get(
                    "home_goals"
                ),
                "away_goals": most_likely_score.get(
                    "away_goals"
                ),
                "probability": most_likely_score.get(
                    "probability"
                ),
            },
            "top_scores": poisson_result.get(
                "top_scores",
                [],
            ),
            "score_distribution": score_distribution,
            "recommended_score": score_distribution.get(
                "recommended_score",
                {},
            ),
            "btts": poisson_result.get("btts", {}),
            "totals": poisson_result.get("totals", {}),
            "team_totals": poisson_result.get(
                "team_totals",
                {},
            ),
            "double_chance": poisson_result.get(
                "double_chance",
                {},
            ),
            "draw_no_bet": poisson_result.get(
                "draw_no_bet",
                {},
            ),
            "clean_sheet": poisson_result.get(
                "clean_sheet",
                {},
            ),
            "win_to_nil": poisson_result.get(
                "win_to_nil",
                {},
            ),
            "match_events": match_events,
            "markets": {
                "match_result": match_result,
                "btts": poisson_result.get(
                    "btts",
                    {},
                ),
                "totals": poisson_result.get(
                    "totals",
                    {},
                ),
                "team_totals": poisson_result.get(
                    "team_totals",
                    {},
                ),
                "double_chance": poisson_result.get(
                    "double_chance",
                    {},
                ),
                "draw_no_bet": poisson_result.get(
                    "draw_no_bet",
                    {},
                ),
                "clean_sheet": poisson_result.get(
                    "clean_sheet",
                    {},
                ),
                "win_to_nil": poisson_result.get(
                    "win_to_nil",
                    {},
                ),
                "corners": match_events.get(
                    "corners",
                    {},
                ),
                "yellow_cards": match_events.get(
                    "yellow_cards",
                    {},
                ),
                "shots": match_events.get(
                    "shots",
                    {},
                ),
                "shots_on_target": match_events.get(
                    "shots_on_target",
                    {},
                ),
                "possession": match_events.get(
                    "possession",
                    {},
                ),
                "match_events": match_events,
            },
            "confidence": confidence,
        }

        response["evaluation"] = self._build_evaluation(
            match=match,
            predicted_outcome=confidence.get(
                "predicted_outcome"
            ),
            most_likely_score=most_likely_score,
            btts=poisson_result.get(
                "btts",
                {},
            ),
            totals=poisson_result.get(
                "totals",
                {},
            ),
        )

        if include_score_matrix:
            response["score_matrix"] = poisson_result.get(
                "score_matrix",
                [],
            )

        if include_features:
            response["features"] = features

        if include_raw_data:
            response["raw_data"] = self._serialize_value(raw_data)

        return response

    @classmethod
    def _build_evaluation(
        cls,
        match: Any,
        predicted_outcome: Any,
        most_likely_score: Dict[str, Any],
        btts: Dict[str, Any],
        totals: Dict[str, Any],
    ) -> Dict[str, Any]:
        home_score = cls._get_value(
            match,
            "home_score",
        )
        away_score = cls._get_value(
            match,
            "away_score",
        )

        if home_score is None or away_score is None:
            return {
                "available": False,
                "reason": "match_not_finished",
                "correct_checks": 0,
                "total_checks": 0,
                "accuracy_percentage": None,
            }

        actual_home = int(home_score)
        actual_away = int(away_score)
        actual_total = actual_home + actual_away

        if actual_home > actual_away:
            actual_outcome = "home_win"
        elif actual_home < actual_away:
            actual_outcome = "away_win"
        else:
            actual_outcome = "draw"

        normalized_predicted_outcome = (
            str(predicted_outcome).strip().lower()
            if predicted_outcome is not None
            else None
        )

        predicted_home = most_likely_score.get(
            "home_goals"
        )
        predicted_away = most_likely_score.get(
            "away_goals"
        )

        exact_score_available = (
            predicted_home is not None
            and predicted_away is not None
        )

        exact_score_correct = (
            exact_score_available
            and int(predicted_home) == actual_home
            and int(predicted_away) == actual_away
        )

        btts_yes_probability = cls._number(
            btts.get("yes")
        )
        btts_no_probability = cls._number(
            btts.get("no")
        )

        predicted_btts = (
            exact_score_available
            and int(predicted_home) > 0
            and int(predicted_away) > 0
        )
        actual_btts = (
            actual_home > 0
            and actual_away > 0
        )

        totals_2_5 = totals.get("2.5", {})

        if not isinstance(totals_2_5, dict):
            totals_2_5 = {}

        over_2_5_probability = cls._number(
            totals_2_5.get("over")
        )
        under_2_5_probability = cls._number(
            totals_2_5.get("under")
        )

        predicted_over_2_5 = (
            exact_score_available
            and (
                int(predicted_home)
                + int(predicted_away)
            ) > 2.5
        )
        actual_over_2_5 = actual_total > 2.5

        winner_correct = (
            normalized_predicted_outcome
            == actual_outcome
        )

        btts_correct = (
            predicted_btts
            == actual_btts
        )

        over_2_5_correct = (
            predicted_over_2_5
            == actual_over_2_5
        )

        checks = [
            winner_correct,
            bool(exact_score_correct),
            btts_correct,
            over_2_5_correct,
        ]

        correct_checks = sum(
            1 for value in checks if value
        )
        total_checks = len(checks)

        accuracy_percentage = round(
            (
                correct_checks
                / total_checks
            )
            * 100.0,
            2,
        )

        return {
            "available": True,
            "actual_score": {
                "home": actual_home,
                "away": actual_away,
                "total": actual_total,
            },
            "predicted_score": {
                "home": (
                    int(predicted_home)
                    if predicted_home is not None
                    else None
                ),
                "away": (
                    int(predicted_away)
                    if predicted_away is not None
                    else None
                ),
                "score": most_likely_score.get(
                    "score"
                ),
            },
            "actual_outcome": actual_outcome,
            "predicted_outcome": (
                normalized_predicted_outcome
            ),
            "winner_correct": winner_correct,
            "exact_score_correct": bool(
                exact_score_correct
            ),
            "btts": {
                "predicted": predicted_btts,
                "actual": actual_btts,
                "correct": btts_correct,
                "yes_probability": round(
                    btts_yes_probability,
                    2,
                ),
                "no_probability": round(
                    btts_no_probability,
                    2,
                ),
            },
            "over_2_5": {
                "predicted": predicted_over_2_5,
                "actual": actual_over_2_5,
                "correct": over_2_5_correct,
                "over_probability": round(
                    over_2_5_probability,
                    2,
                ),
                "under_probability": round(
                    under_2_5_probability,
                    2,
                ),
            },
            "correct_checks": correct_checks,
            "total_checks": total_checks,
            "accuracy_percentage": (
                accuracy_percentage
            ),
        }

    @classmethod
    def _team_summary(cls, team: Any) -> Dict[str, Any]:
        return {
            "id": cls._get_value(team, "id", "team_id"),
            "name": cls._get_value(
                team,
                "name",
                "team_name",
            ),
            "country": cls._get_value(team, "country"),
            "logo": cls._get_value(
                team,
                "logo",
                "logo_url",
            ),
        }

    @staticmethod
    def _get_value(source: Any, *keys: str) -> Any:
        if source is None:
            return None

        if isinstance(source, dict):
            for key in keys:
                value = source.get(key)
                if value is not None:
                    return value
            return None

        for key in keys:
            value = getattr(source, key, None)
            if value is not None:
                return value

        return None

    @classmethod
    def _serialize_value(cls, value: Any) -> Any:
        """
        يحول كائنات SQLAlchemy والقوائم والقواميس إلى بيانات قابلة
        للإرجاع عبر FastAPI عند تفعيل include_raw_data.
        """

        if value is None:
            return None

        if isinstance(value, (str, int, float, bool)):
            return value

        if isinstance(value, dict):
            return {
                key: cls._serialize_value(item)
                for key, item in value.items()
            }

        if isinstance(value, (list, tuple, set)):
            return [
                cls._serialize_value(item)
                for item in value
            ]

        if isinstance(value, datetime):
            return value.isoformat()

        table = getattr(value, "__table__", None)

        if table is not None:
            return {
                column.name: cls._serialize_value(
                    getattr(value, column.name, None)
                )
                for column in table.columns
            }

        return str(value)

    @staticmethod
    def _validate_match_id(match_id: Any) -> int:
        try:
            value = int(match_id)
        except (TypeError, ValueError) as exc:
            raise ValueError(
                "match_id يجب أن يكون عددًا صحيحًا."
            ) from exc

        if value <= 0:
            raise ValueError(
                "match_id يجب أن يكون أكبر من صفر."
            )

        return value

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


class PredictionEngineError(Exception):
    """
    خطأ منظم يوضح المرحلة التي فشل فيها المحرك.
    """

    def __init__(
        self,
        stage: str,
        message: str,
    ) -> None:
        self.stage = stage
        self.message = message

        super().__init__(f"[{stage}] {message}")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": False,
            "error": {
                "type": self.__class__.__name__,
                "stage": self.stage,
                "message": self.message,
            },
        }


class MatchNotFoundError(PredictionEngineError):
    """
    يظهر عندما لا تعيد خدمة البيانات معلومات المباراة.
    """

    def __init__(self, match_id: int) -> None:
        self.match_id = match_id

        super().__init__(
            stage="data_loading",
            message=f"لم يتم العثور على المباراة رقم {match_id}.",
        )
