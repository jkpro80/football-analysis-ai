from unittest.mock import MagicMock

from app.engine.prediction_engine_v32 import PredictionEngineV32


def build_prediction():
    return {
        "recent_form": {
            "home": {"matches_played": 5},
            "away": {"matches_played": 5},
            "home_venue": {"matches_played": 5},
            "away_venue": {"matches_played": 4},
        },
        "head_to_head": {
            "matches_played": 0,
        },
        "expected_goals": {
            "home": 0.71,
            "away": 0.97,
            "total": 1.68,
        },
        "probabilities": {
            "home_win": 25.79,
            "draw": 33.86,
            "away_win": 40.35,
        },
        "confidence": "low",
        "confidence_score": 60,
        "best_pick": {
            "key": "under_3_5",
            "label": "أقل من 3.5 هدف",
            "probability": 90.98,
            "rating": 5,
        },
        "analysis": [],
        "rating_factors": {
            "home_attack": 0.585,
            "away_attack": 0.9499,
            "home_defense": 0.99,
            "away_defense": 0.9024,
            "home_form": 0.95,
            "away_form": 0.925,
            "home_elo": 1.003,
            "away_elo": 0.997,
            "home_advantage": 1.1,
        },
    }


def test_data_quality_score():
    engine = PredictionEngineV32(db=MagicMock())

    quality = engine.calculate_data_quality(
        build_prediction()
    )

    assert quality["score"] == 82
    assert quality["grade"] == "B"
    assert quality["inputs"]["head_to_head_matches"] == 0


def test_confidence_adjustment():
    engine = PredictionEngineV32(db=MagicMock())

    prediction = build_prediction()

    quality = engine.calculate_data_quality(
        prediction
    )

    confidence = engine.adjust_confidence(
        prediction,
        quality,
    )

    assert confidence["confidence_score"] == 68
    assert confidence["confidence"] == "medium"
    assert confidence["confidence_details"]["original_score"] == 60


def test_best_pick_rating_is_reduced():
    engine = PredictionEngineV32(db=MagicMock())

    prediction = build_prediction()

    quality = engine.calculate_data_quality(
        prediction
    )

    confidence = engine.adjust_confidence(
        prediction,
        quality,
    )

    best_pick = engine.refine_best_pick(
        prediction,
        confidence,
        quality,
    )

    assert best_pick is not None
    assert best_pick["original_rating"] == 5
    assert best_pick["rating"] == 3
    assert best_pick["qualified"] is True


def test_upgrade_prediction_sets_v32_model():
    engine = PredictionEngineV32(db=MagicMock())

    result = engine.upgrade_prediction(
        build_prediction()
    )

    assert result["model"] == "Prediction Engine V3.2"
    assert result["data_quality"]["score"] == 82
    assert result["confidence_score"] == 68
    assert result["best_pick"]["rating"] == 3
    assert result["v32"]["base_model"] == (
        "Prediction Engine V3.1"
    )


def test_low_quality_pick_is_not_strong():
    engine = PredictionEngineV32(db=MagicMock())

    prediction = build_prediction()

    prediction["recent_form"] = {
        "home": {"matches_played": 1},
        "away": {"matches_played": 1},
        "home_venue": {"matches_played": 0},
        "away_venue": {"matches_played": 0},
    }

    prediction["rating_factors"] = {}

    quality = engine.calculate_data_quality(
        prediction
    )

    confidence = engine.adjust_confidence(
        prediction,
        quality,
    )

    best_pick = engine.refine_best_pick(
        prediction,
        confidence,
        quality,
    )

    assert quality["score"] < 55
    assert best_pick is not None
    assert best_pick["rating"] <= 2
    assert best_pick["qualified"] is False
    assert "warning" in best_pick