from app.services.explainable_ai_engine import ExplainableAIEngine


def test_explainable_ai_engine_returns_explanation():
    prediction = {
        "probabilities": {
            "home_win": 0.62,
            "draw": 0.22,
            "away_win": 0.16,
        },
        "expected_goals": {
            "home": 2.10,
            "away": 0.95,
            "total": 3.05,
        },
        "confidence": {
            "score": 0.74,
        },
    }

    decision = {
        "recommended_outcome": "home_win",
        "decision_score": 0.74,
        "risk": "low",
    }

    engine = ExplainableAIEngine()
    result = engine.explain(prediction, decision)

    assert result["recommended_outcome"] == "home_win"
    assert result["summary"]
    assert result["strengths"]
    assert result["risks"]
    assert result["factors"]["probabilities"]["home_win"] == 0.62
    assert result["model"] == "Explainable AI 1.0"
