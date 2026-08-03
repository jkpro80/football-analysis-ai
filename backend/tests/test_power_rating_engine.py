from app.engine.power_rating_engine import (
    PowerRatingEngine,
    TeamPowerComponents,
)


def test_power_rating_engine():

    engine = PowerRatingEngine()

    home = TeamPowerComponents(
        form=85,
        attack=82,
        defense=80,
        home_advantage=70,
        elo=90,
    )

    away = TeamPowerComponents(
        form=70,
        attack=75,
        defense=74,
        home_advantage=50,
        elo=82,
    )

    result = engine.calculate(home, away)

    assert result["home_rating"] > result["away_rating"]
    assert result["difference"] > 0


def test_equal_teams():

    engine = PowerRatingEngine()

    team = TeamPowerComponents(
        form=80,
        attack=80,
        defense=80,
        home_advantage=50,
        elo=80,
    )

    result = engine.calculate(team, team)

    assert result["difference"] == 0