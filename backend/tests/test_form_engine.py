from app.engine.form_engine import FormEngine, MatchResult


def test_form_engine():

    engine = FormEngine()

    matches = [
        MatchResult(2, 1),
        MatchResult(1, 1),
        MatchResult(3, 0),
        MatchResult(0, 2),
        MatchResult(2, 0),
    ]

    result = engine.calculate(matches)

    assert result["wins"] == 3
    assert result["draws"] == 1
    assert result["losses"] == 1
    assert result["points"] == 10
    assert result["form_score"] == 66.67