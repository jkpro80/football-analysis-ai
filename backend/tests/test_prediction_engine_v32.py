from typing import Any

from app.engine.prediction_engine_v32 import (
    PredictionEngineV32,
)


class FakePredictionEngineV31:
    MODEL_VERSION = "Prediction Engine V3.1"

    def predict_match(
        self,
        match_id: int,
    ) -> dict[str, Any]:
        return {
            "match_id": match_id,
            "expected_goals": {
                "home": 2.1,
                "away": 1.2,
                "total": 3.3,
            },
            "probabilities": {
                "home_win": 65.0,
                "draw": 20.0,
                "away_win": 15.0,
            },
        }

    def predict_teams(
        self,
        home_team_id: int,
        away_team_id: int,
    ) -> dict[str, Any]:
        return {
            "home_team_id": home_team_id,
            "away_team_id": away_team_id,
            "expected_goals": {
                "home": 1.8,
                "away": 1.1,
                "total": 2.9,
            },
            "probabilities": {
                "home_win": 0.55,
                "draw": 0.27,
                "away_win": 0.18,
            },
        }


def create_engine():
    return PredictionEngineV32(
        v31_engine=FakePredictionEngineV31(),
    )


def test_prediction_engine_v32_predict_match():
    engine = create_engine()

    result = engine.predict_match(16)

    assert result["match_id"] == 16

    assert result["engine_version"] == (
        "Prediction Engine V3.2"
    )

    confidence = result["analysis"][
        "confidence_breakdown"
    ]

    assert confidence["level"] == "high"
    assert confidence["recommended_outcome"] == (
        "home_win"
    )
    assert confidence["top_probability"] == 65.0
    assert confidence["probability_margin"] == 45.0


def test_prediction_engine_v32_predict_teams():
    engine = create_engine()

    result = engine.predict_teams(
        home_team_id=1,
        away_team_id=2,
    )

    confidence = result["analysis"][
        "confidence_breakdown"
    ]

    assert result["home_team_id"] == 1
    assert result["away_team_id"] == 2

    assert confidence["recommended_outcome"] == (
        "home_win"
    )

    assert confidence["top_probability"] == 55.0
    assert confidence["second_probability"] == 27.0


def test_probability_decimal_conversion():
    engine = create_engine()

    assert engine._to_percentage(0.62) == 62.0
    assert engine._to_percentage(62) == 62.0
    assert engine._to_percentage(150) == 100.0
    assert engine._to_percentage(-10) == 0.0
    assert engine._to_percentage("invalid") == 0.0


def test_low_confidence_prediction():
    engine = create_engine()

    prediction = {
        "probabilities": {
            "home_win": 36.0,
            "draw": 34.0,
            "away_win": 30.0,
        }
    }

    confidence = (
        engine.build_confidence_breakdown(
            prediction
        )
    )

    assert confidence["level"] == "low"
    assert confidence["recommended_outcome"] == (
        "home_win"
    )
    assert confidence["probability_margin"] == 2.0


def test_prediction_engine_v32_requires_dependency():
    try:
        PredictionEngineV32()

    except ValueError as error:
        assert "db or v31_engine" in str(error)

    else:
        raise AssertionError(
            "ValueError was not raised"
        )
