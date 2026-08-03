from app.engine.attack_engine import AttackEngine, AttackStats


def test_attack_engine():

    engine = AttackEngine()

    stats = AttackStats(
        goals_per_match=2.2,
        xg=2.0,
        shots=16,
        shots_on_target=7,
        big_chances=4,
    )

    result = engine.calculate(stats)

    assert result["attack_score"] > 80