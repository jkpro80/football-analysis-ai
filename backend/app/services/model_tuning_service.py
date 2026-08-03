import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.services.auto_calibration_service import (
    AutoCalibrationService,
)


class ModelTuningService:
    """
    إنشاء وحفظ معاملات المعايرة الخاصة
    بمحرك Prediction Engine V3.1.

    لا تُعدّل هذه الخدمة بيانات الفرق،
    وإنما تحفظ ملف إعدادات مستقل يمكن
    لمحرك التوقعات قراءته لاحقًا.
    """

    MODEL_VERSION = "Prediction Engine V3"
    TUNED_MODEL_VERSION = "Prediction Engine V3.1"

    DEFAULT_CONFIG: dict[str, Any] = {
        "source_model_version": MODEL_VERSION,
        "model_version": TUNED_MODEL_VERSION,
        "enabled": False,
        "sample_size": 0,
        "home_goal_multiplier": 1.0,
        "away_goal_multiplier": 1.0,
        "total_goal_multiplier": 1.0,
        "attack_multiplier": 1.0,
        "home_advantage_multiplier": 1.0,
        "created_at": None,
        "updated_at": None,
    }

    def __init__(
        self,
        db: Session,
        config_path: str | Path | None = None,
        source_model_version: str | None = None,
        tuned_model_version: str | None = None,
    ) -> None:
        self.db = db
        self.source_model_version = (
            str(source_model_version).strip()
            if source_model_version is not None
            and str(source_model_version).strip()
            else self.MODEL_VERSION
        )
        self.tuned_model_version = (
            str(tuned_model_version).strip()
            if tuned_model_version is not None
            and str(tuned_model_version).strip()
            else self.TUNED_MODEL_VERSION
        )

        self.calibration_service = (
            AutoCalibrationService(db)
        )

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
        حصر قيمة المعامل ضمن الحدود الآمنة.
        """

        return max(
            minimum,
            min(value, maximum),
        )

    def ensure_config_directory(
        self,
    ) -> None:
        """
        إنشاء مجلد الإعدادات إذا لم يكن موجودًا.
        """

        self.config_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

    def get_default_config(
        self,
    ) -> dict[str, Any]:
        """
        إرجاع نسخة من الإعدادات الافتراضية
        للإصدار المحدد عند إنشاء الخدمة.
        """

        config = dict(
            self.DEFAULT_CONFIG
        )

        config["source_model_version"] = (
            self.source_model_version
        )
        config["model_version"] = (
            self.tuned_model_version
        )

        return config

    def load_config(
        self,
    ) -> dict[str, Any]:
        """
        قراءة ملف المعاملات الحالي.

        عند عدم وجود الملف، تُعاد القيم
        الافتراضية دون إنشاء الملف.
        """

        if not self.config_path.exists():
            return self.get_default_config()

        try:
            with self.config_path.open(
                "r",
                encoding="utf-8",
            ) as file:
                data = json.load(file)

        except (
            OSError,
            json.JSONDecodeError,
        ) as error:
            raise ValueError(
                "Model weights file is invalid."
            ) from error

        config = self.get_default_config()
        config.update(data)

        return config

    def validate_recommendations(
        self,
        recommendations: dict[str, Any],
    ) -> dict[str, float]:
        """
        التحقق من معاملات المعايرة وحصرها
        ضمن حدود آمنة.
        """

        required_keys = {
            "home_goal_multiplier",
            "away_goal_multiplier",
            "total_goal_multiplier",
            "attack_multiplier",
            "home_advantage_multiplier",
        }

        missing_keys = (
            required_keys
            - recommendations.keys()
        )

        if missing_keys:
            missing_text = ", ".join(
                sorted(missing_keys)
            )

            raise ValueError(
                "Missing calibration values: "
                f"{missing_text}"
            )

        return {
            "home_goal_multiplier": round(
                self.clamp(
                    float(
                        recommendations[
                            "home_goal_multiplier"
                        ]
                    ),
                    0.90,
                    1.10,
                ),
                4,
            ),
            "away_goal_multiplier": round(
                self.clamp(
                    float(
                        recommendations[
                            "away_goal_multiplier"
                        ]
                    ),
                    0.90,
                    1.10,
                ),
                4,
            ),
            "total_goal_multiplier": round(
                self.clamp(
                    float(
                        recommendations[
                            "total_goal_multiplier"
                        ]
                    ),
                    0.90,
                    1.10,
                ),
                4,
            ),
            "attack_multiplier": round(
                self.clamp(
                    float(
                        recommendations[
                            "attack_multiplier"
                        ]
                    ),
                    0.90,
                    1.10,
                ),
                4,
            ),
            "home_advantage_multiplier": round(
                self.clamp(
                    float(
                        recommendations[
                            "home_advantage_multiplier"
                        ]
                    ),
                    0.95,
                    1.05,
                ),
                4,
            ),
        }

    def build_config(
        self,
        limit: int | None = None,
    ) -> dict[str, Any]:
        """
        تشغيل Auto Calibration وبناء
        ملف معاملات V3.1 دون حفظه.
        """

        calibration = (
            self.calibration_service
            .calibrate(
                model_version=(
                    self.source_model_version
                ),
                limit=limit,
            )
        )

        if not calibration.get(
            "calibration_ready",
            False,
        ):
            raise ValueError(
                "Calibration is not ready. "
                "At least 30 evaluated "
                "predictions are required."
            )

        recommendations = (
            self.validate_recommendations(
                calibration[
                    "recommendations"
                ]
            )
        )

        current_config = self.load_config()

        now = datetime.now(
            timezone.utc
        ).isoformat()

        created_at = (
            current_config.get(
                "created_at"
            )
            or now
        )

        return {
            "source_model_version": (
                self.source_model_version
            ),
            "model_version": (
                self.tuned_model_version
            ),
            "enabled": True,
            "sample_size": int(
                calibration[
                    "sample_size"
                ]
            ),
            **recommendations,
            "accuracy_snapshot": (
                calibration.get(
                    "accuracy",
                    {},
                )
            ),
            "goal_averages_snapshot": (
                calibration.get(
                    "goal_averages",
                    {},
                )
            ),
            "mean_absolute_error_snapshot": (
                calibration.get(
                    "mean_absolute_error",
                    {},
                )
            ),
            "created_at": created_at,
            "updated_at": now,
        }

    def save_config(
        self,
        limit: int | None = None,
        *,
        enabled: bool = True,
    ) -> dict[str, Any]:
        """
        تشغيل المعايرة وحفظ معاملات V3.1.
        """

        config = self.build_config(
            limit=limit
        )

        config["enabled"] = bool(enabled)

        self.ensure_config_directory()

        temporary_path = (
            self.config_path.with_suffix(
                ".tmp"
            )
        )

        try:
            with temporary_path.open(
                "w",
                encoding="utf-8",
            ) as file:
                json.dump(
                    config,
                    file,
                    ensure_ascii=False,
                    indent=2,
                )

            temporary_path.replace(
                self.config_path
            )

        except OSError:
            if temporary_path.exists():
                temporary_path.unlink()

            raise

        return {
            "saved": True,
            "enabled": bool(
                config.get("enabled", False)
            ),
            "config_path": str(
                self.config_path
            ),
            "config": config,
        }

    def disable_config(
        self,
    ) -> dict[str, Any]:
        """
        تعطيل المعايرة مع إبقاء الملف
        والمعاملات محفوظة.
        """

        config = self.load_config()

        config["enabled"] = False
        config["updated_at"] = (
            datetime.now(
                timezone.utc
            ).isoformat()
        )

        self.ensure_config_directory()

        with self.config_path.open(
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                config,
                file,
                ensure_ascii=False,
                indent=2,
            )

        return {
            "saved": True,
            "enabled": False,
            "config_path": str(
                self.config_path
            ),
        }

    def get_status(
        self,
    ) -> dict[str, Any]:
        """
        عرض حالة إعدادات المعايرة الحالية.
        """

        config = self.load_config()

        return {
            "exists": (
                self.config_path.exists()
            ),
            "config_path": str(
                self.config_path
            ),
            "enabled": bool(
                config.get(
                    "enabled",
                    False,
                )
            ),
            "model_version": (
                config.get(
                    "model_version"
                )
            ),
            "sample_size": int(
                config.get(
                    "sample_size",
                    0,
                )
            ),
            "weights": {
                "home_goal_multiplier": (
                    config.get(
                        "home_goal_multiplier",
                        1.0,
                    )
                ),
                "away_goal_multiplier": (
                    config.get(
                        "away_goal_multiplier",
                        1.0,
                    )
                ),
                "total_goal_multiplier": (
                    config.get(
                        "total_goal_multiplier",
                        1.0,
                    )
                ),
                "attack_multiplier": (
                    config.get(
                        "attack_multiplier",
                        1.0,
                    )
                ),
                "home_advantage_multiplier": (
                    config.get(
                        "home_advantage_multiplier",
                        1.0,
                    )
                ),
            },
            "updated_at": config.get(
                "updated_at"
            ),
        }


