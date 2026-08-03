import pytest

from app.engine.elo_rating_engine import (
    EloRatingEngine,
)


def test_equal_teams_with_home_advantage():
    engine = EloRatingEngine()

    result = engine.match_probabilities(
        home_rating=1500,
        away_rating=1500,
    )

    assert result["home"] > 50
    assert result["away"] < 50

    assert round(
        result["home"]
        + result["away"],
        2,
    ) == 100.0


def test_stronger_home_team():
    engine = EloRatingEngine()

    result = engine.compare_teams(
        home_rating=1700,
        away_rating=1450,
    )

    assert result["stronger_team"] == "home"
    assert result["strength_level"] == "clear"
    assert result["home"] > result["away"]


def test_stronger_away_team():
    engine = EloRatingEngine()

    result = engine.compare_teams(
        home_rating=1400,
        away_rating=1750,
    )

    assert result["stronger_team"] == "away"
    assert result["strength_level"] == "clear"
    assert result["away"] > result["home"]


def test_home_win_increases_rating():
    engine = EloRatingEngine()

    result = engine.update_ratings(
        home_rating=1500,
        away_rating=1500,
        home_goals=2,
        away_goals=0,
    )

    assert (
        result["after"]["home"]
        > result["before"]["home"]
    )

    assert (
        result["after"]["away"]
        < result["before"]["away"]
    )

    assert result[
        "goal_difference_multiplier"
    ] == 1.5


def test_away_win_increases_away_rating():
    engine = EloRatingEngine()

    result = engine.update_ratings(
        home_rating=1600,
        away_rating=1450,
        home_goals=0,
        away_goals=1,
    )

    assert result["change"]["home"] < 0
    assert result["change"]["away"] > 0


def test_draw_updates_ratings():
    engine = EloRatingEngine()

    result = engine.update_ratings(
        home_rating=1600,
        away_rating=1400,
        home_goals=1,
        away_goals=1,
    )

    assert result["actual"]["home"] == 0.5
    assert result["actual"]["away"] == 0.5

    assert result["change"]["home"] < 0
    assert result["change"]["away"] > 0


def test_large_win_has_bigger_multiplier():
    engine = EloRatingEngine()

    result = engine.update_ratings(
        home_rating=1500,
        away_rating=1500,
        home_goals=5,
        away_goals=0,
    )

    assert (
        result["goal_difference_multiplier"]
        > 1.75
    )

    assert (
        result["effective_k_factor"]
        > engine.k_factor
    )


def test_invalid_k_factor():
    with pytest.raises(
        ValueError,
        match="k_factor",
    ):
        EloRatingEngine(
            k_factor=0,
        )


def test_invalid_home_advantage():
    with pytest.raises(
        ValueError,
        match="home_advantage",
    ):
        EloRatingEngine(
            home_advantage=-10,
        )