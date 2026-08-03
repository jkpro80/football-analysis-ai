from app.engine.home_advantage_engine import (
    HomeAdvantageEngine,
    HomeAdvantageStats,
)


def test_strong_home_advantage():
    engine = HomeAdvantageEngine()

    stats = HomeAdvantageStats(
        home_points_per_match=2.5,
        home_goals_per_match=2.4,
        home_goals_against_per_match=0.7,
        away_points_per_match=1.1,
        away_goals_per_match=1.0,
        away_goals_against_per_match=1.8,
    )

    result = engine.calculate(stats)

    assert 0 <= result["home_advantage_score"] <= 100
    assert result["home_advantage_score"] > 60
    assert result["home_strength"] > result["away_strength"]


def test_balanced_home_and_away_performance():
    engine = HomeAdvantageEngine()

    stats = HomeAdvantageStats(
        home_points_per_match=1.5,
        home_goals_per_match=1.4,
        home_goals_against_per_match=1.2,
        away_points_per_match=1.5,
        away_goals_per_match=1.4,
        away_goals_against_per_match=1.2,
    )

    result = engine.calculate(stats)

    assert result["home_advantage_score"] == 50.0
    assert result["strength_difference"] == 0.0


def test_strong_away_team_reduces_home_advantage():
    engine = HomeAdvantageEngine()

    stats = HomeAdvantageStats(
        home_points_per_match=1.0,
        home_goals_per_match=1.0,
        home_goals_against_per_match=1.8,
        away_points_per_match=2.4,
        away_goals_per_match=2.2,
        away_goals_against_per_match=0.8,
    )

    result = engine.calculate(stats)

    assert 0 <= result["home_advantage_score"] <= 100
    assert result["home_advantage_score"] < 50
    assert result["away_strength"] > result["home_strength"]