import json
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.engine.poisson_engine import (
    run_poisson_model,
)
from app.engine.prediction_engine_v3 import (
    PredictionEngineV3,
)


class PredictionEngineV31(
    PredictionEngineV3
):
    """
    Prediction Engine V3.1

    يعتمد على نتائج V3 ثم يطبق معاملات
    المعايرة المحفوظة في model_weights.json
    ويعيد تشغيل نموذج Poisson.
    """

    MODEL_VERSION = "Prediction Engine V3.1"

    DEFAULT_WEIGHTS: dict[str, Any] = {
        "enabled": False,
        "model_version": MODEL_VERSION,
        "sample_size": 0,
        "home_goal_multiplier": 1.0,
        "away_goal_multiplier": 1.0,
        "total_goal_multiplier": 1.0,
        "attack_multiplier": 1.0,
        "home_advantage_multiplier": 1.0,
    }

    def __init__(
        self,
        db: Session,
        config_path: str | Path | None = None,
    ) -> None:
        super().__init__(db)

        if config_path is None:
            backend_root = Path(
                __file__
            ).resolve().parents[2]

            self.config_path = (
                backend_root
                / "app"
                / "config"
                / "model_weights.json"
            )

        else:
            self.config_path = Path(
                config_path
            ).resolve()

    @staticmethod
    def clamp(
        value: float,
        minimum: float,
        maximum: float,
    ) -> float:
        """
        حصر القيمة ضمن حدود آمنة.
        """

        return max(
            minimum,
            min(value, maximum),
        )

    def load_weights(
        self,
    ) -> dict[str, Any]:
        """
        قراءة معاملات المعايرة.

        إذا لم يوجد الملف أو كانت المعايرة
        معطلة، يتم استخدام معاملات 1.0.
        """

        weights = dict(
            self.DEFAULT_WEIGHTS
        )

        if not self.config_path.exists():
            return weights

        try:
            with self.config_path.open(
                "r",
                encoding="utf-8",
            ) as file:
                stored_weights = json.load(
                    file
                )

        except (
            OSError,
            json.JSONDecodeError,
        ):
            return weights

        if not isinstance(
            stored_weights,
            dict,
        ):
            return weights

        weights.update(
            stored_weights
        )

        weights[
            "home_goal_multiplier"
        ] = self.clamp(
            float(
                weights.get(
                    "home_goal_multiplier",
                    1.0,
                )
            ),
            0.90,
            1.10,
        )

        weights[
            "away_goal_multiplier"
        ] = self.clamp(
            float(
                weights.get(
                    "away_goal_multiplier",
                    1.0,
                )
            ),
            0.90,
            1.10,
        )

        weights[
            "total_goal_multiplier"
        ] = self.clamp(
            float(
                weights.get(
                    "total_goal_multiplier",
                    1.0,
                )
            ),
            0.90,
            1.10,
        )

        weights[
            "attack_multiplier"
        ] = self.clamp(
            float(
                weights.get(
                    "attack_multiplier",
                    1.0,
                )
            ),
            0.90,
            1.10,
        )

        weights[
            "home_advantage_multiplier"
        ] = self.clamp(
            float(
                weights.get(
                    "home_advantage_multiplier",
                    1.0,
                )
            ),
            0.95,
            1.05,
        )

        return weights

    def apply_calibration(
        self,
        home_expected_goals: float,
        away_expected_goals: float,
        weights: dict[str, Any],
    ) -> dict[str, float]:
        """
        تطبيق المعايرة على xG.

        يتم توزيع معامل الهجوم ومعامل مجموع
        الأهداف بصورة معتدلة على الفريقين.
        """

        if not bool(
            weights.get(
                "enabled",
                False,
            )
        ):
            return {
                "home": round(
                    home_expected_goals,
                    2,
                ),
                "away": round(
                    away_expected_goals,
                    2,
                ),
                "total": round(
                    home_expected_goals
                    + away_expected_goals,
                    2,
                ),
            }

        attack_multiplier = float(
            weights[
                "attack_multiplier"
            ]
        )

        total_multiplier = float(
            weights[
                "total_goal_multiplier"
            ]
        )

        # توزيع تأثير المعامل العام
        # لتجنب مضاعفة قوية جدًا.
        shared_multiplier = (
            attack_multiplier
            * total_multiplier
        ) ** 0.5

        calibrated_home = (
            float(home_expected_goals)
            * float(
                weights[
                    "home_goal_multiplier"
                ]
            )
            * shared_multiplier
            * float(
                weights[
                    "home_advantage_multiplier"
                ]
            )
        )

        calibrated_away = (
            float(away_expected_goals)
            * float(
                weights[
                    "away_goal_multiplier"
                ]
            )
            * shared_multiplier
        )

        calibrated_home = self.clamp(
            calibrated_home,
            0.15,
            4.50,
        )

        calibrated_away = self.clamp(
            calibrated_away,
            0.15,
            4.50,
        )

        return {
            "home": round(
                calibrated_home,
                2,
            ),
            "away": round(
                calibrated_away,
                2,
            ),
            "total": round(
                calibrated_home
                + calibrated_away,
                2,
            ),
        }

    def rebuild_prediction(
        self,
        base_prediction: dict[str, Any],
    ) -> dict[str, Any]:
        """
        إعادة بناء التوقع باستخدام xG
        بعد تطبيق المعايرة.
        """

        weights = self.load_weights()

        base_expected_goals = (
            base_prediction[
                "expected_goals"
            ]
        )

        calibrated_expected_goals = (
            self.apply_calibration(
                home_expected_goals=float(
                    base_expected_goals[
                        "home"
                    ]
                ),
                away_expected_goals=float(
                    base_expected_goals[
                        "away"
                    ]
                ),
                weights=weights,
            )
        )

        poisson_result = run_poisson_model(
            home_expected_goals=(
                calibrated_expected_goals[
                    "home"
                ]
            ),
            away_expected_goals=(
                calibrated_expected_goals[
                    "away"
                ]
            ),
        )

        confidence_data = (
            self.get_confidence(
                poisson_result[
                    "probabilities"
                ]
            )
        )

        best_pick = self.get_best_pick(
            poisson_result
        )

        result = dict(
            base_prediction
        )

        result.update(
            poisson_result
        )

        result.update(
            confidence_data
        )

        result[
            "best_pick"
        ] = best_pick

        result[
            "model"
        ] = self.MODEL_VERSION

        result[
            "calibration"
        ] = {
            "enabled": bool(
                weights.get(
                    "enabled",
                    False,
                )
            ),
            "source_model": (
                PredictionEngineV3
                .MODEL_VERSION
            ),
            "sample_size": int(
                weights.get(
                    "sample_size",
                    0,
                )
            ),
            "weights": {
                "home_goal_multiplier": (
                    weights[
                        "home_goal_multiplier"
                    ]
                ),
                "away_goal_multiplier": (
                    weights[
                        "away_goal_multiplier"
                    ]
                ),
                "total_goal_multiplier": (
                    weights[
                        "total_goal_multiplier"
                    ]
                ),
                "attack_multiplier": (
                    weights[
                        "attack_multiplier"
                    ]
                ),
                "home_advantage_multiplier": (
                    weights[
                        "home_advantage_multiplier"
                    ]
                ),
            },
            "before": {
                "home": (
                    base_expected_goals[
                        "home"
                    ]
                ),
                "away": (
                    base_expected_goals[
                        "away"
                    ]
                ),
                "total": (
                    base_expected_goals[
                        "total"
                    ]
                ),
            },
            "after": (
                calibrated_expected_goals
            ),
        }

        return result

    def predict_match(
        self,
        match_id: int,
    ) -> dict[str, Any]:
        """
        توقع مباراة باستخدام V3 ثم
        تطبيق معاملات V3.1.
        """

        base_prediction = (
            super().predict_match(
                match_id
            )
        )

        return self.rebuild_prediction(
            base_prediction
        )

    def predict_teams(
        self,
        home_team_id: int,
        away_team_id: int,
    ) -> dict[str, Any]:
        """
        توقع مباشر بين فريقين باستخدام
        معاملات V3.1.
        """

        base_prediction = (
            super().predict_teams(
                home_team_id=home_team_id,
                away_team_id=away_team_id,
            )
        )

        return self.rebuild_prediction(
            base_prediction
        )