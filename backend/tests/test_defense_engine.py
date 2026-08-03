from app.engine.defense_engine import DefenseEngine, DefenseStats


def test_defense_engine_for_strong_team():
    engine = DefenseEngine()

    stats = DefenseStats(
        goals_against_per_match=0.7,
        xga=0.85,
        clean_sheet_rate=0.50,
        blocks_per_match=4.0,
        interceptions_per_match=10.0,
    )

    result = engine.calculate(stats)

    assert 0 <= result["defense_score"] <= 100
    assert result["defense_score"] > 60


def test_defense_engine_for_weak_team():
    engine = DefenseEngine()

    stats = DefenseStats(
        goals_against_per_match=2.5,
        xga=2.3,
        clean_sheet_rate=10,
        blocks_per_match=2.0,
        interceptions_per_match=5.0,
    )

    result = engine.calculate(stats)

    assert 0 <= result["defense_score"] <= 100
    assert result["defense_score"] < 40


def test_defense_score_never_becomes_negative():
    engine = DefenseEngine()

    stats = DefenseStats(
        goals_against_per_match=10.0,
        xga=10.0,
        clean_sheet_rate=0,
        blocks_per_match=0,
        interceptions_per_match=0,
    )

    result = engine.calculate(stats)

    assert result["defense_score"] == 0.0