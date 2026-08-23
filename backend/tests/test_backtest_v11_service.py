from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.services.backtest_v11_service import (
    BacktestV11Service,
)


def create_service():
    db = MagicMock()

    service = BacktestV11Service.__new__(
        BacktestV11Service
    )

    service.db = db
    service.pipeline = MagicMock()

    return service, db


def make_match(
    match_id=1,
    home_score=2,
    away_score=1,
    date="2026-08-23",
):
    return SimpleNamespace(
        id=match_id,
        home_score=home_score,
        away_score=away_score,
        date=date,
    )


def make_evaluation(
    match_id=1,
    *,
    result=True,
    btts=True,
    over_2_5=True,
    double_chance=True,
    exact_score=False,
    home_absolute=0.5,
    away_absolute=0.25,
    total_absolute=0.75,
    home_squared=0.25,
    away_squared=0.0625,
    total_squared=0.5625,
    brier_score=0.1,
    log_loss=0.2,
    confidence_level="high",
    ranking_score=4.5,
):
    return {
        "match_id": match_id,
        "correct": {
            "result": result,
            "btts": btts,
            "over_2_5": over_2_5,
            "double_chance": double_chance,
            "exact_score": exact_score,
        },
        "goal_errors": {
            "home_absolute": home_absolute,
            "away_absolute": away_absolute,
            "total_absolute": total_absolute,
            "home_squared": home_squared,
            "away_squared": away_squared,
            "total_squared": total_squared,
        },
        "probability_metrics": {
            "brier_score": brier_score,
            "log_loss": log_loss,
        },
        "confidence": {
            "value": 0.8,
            "level": confidence_level,
        },
        "ranking_score": ranking_score,
    }


def test_run_returns_error_when_no_finished_matches():
    service, db = create_service()

    service._get_finished_matches = MagicMock(
        return_value=[]
    )

    result = service.run()

    assert result["status"] == "error"
    assert result["model"] == "Prediction V11"

    assert result["sample"] == {
        "finished_matches_found": 0,
        "matches_tested": 0,
        "failed": 0,
    }

    assert result["failures"] == []

    service.pipeline.analyze_match.assert_not_called()
    db.rollback.assert_not_called()


def test_run_processes_successful_match_without_persistence():
    service, db = create_service()

    match = make_match(match_id=42)

    service._get_finished_matches = MagicMock(
        return_value=[match]
    )

    prediction = {"model": "Prediction Engine V11"}

    service.pipeline.analyze_match.return_value = (
        prediction
    )

    evaluation = make_evaluation(match_id=42)

    service._evaluate_match = MagicMock(
        return_value=evaluation
    )

    result = service.run(
        limit=50,
        history_limit=7,
        max_goals=9,
        top_scores_count=6,
    )

    service._get_finished_matches.assert_called_once_with(
        limit=50
    )

    service.pipeline.analyze_match.assert_called_once_with(
        match_id=42,
        history_limit=7,
        max_goals=9,
        top_scores_count=6,
        save_features=False,
        save_prediction=False,
    )

    service._evaluate_match.assert_called_once_with(
        match=match,
        prediction=prediction,
    )

    db.rollback.assert_not_called()

    assert result["status"] == "success"
    assert result["model"] == "Prediction V11"
    assert result["sample"] == {
        "finished_matches_found": 1,
        "matches_tested": 1,
        "failed": 0,
    }


def test_run_calculates_accuracy_and_error_metrics():
    service, _ = create_service()

    matches = [
        make_match(match_id=1),
        make_match(match_id=2),
    ]

    service._get_finished_matches = MagicMock(
        return_value=matches
    )

    service.pipeline.analyze_match.side_effect = [
        {"prediction": 1},
        {"prediction": 2},
    ]

    evaluations = [
        make_evaluation(
            match_id=1,
            result=True,
            btts=True,
            over_2_5=True,
            double_chance=True,
            exact_score=False,
            home_absolute=1.0,
            away_absolute=0.5,
            total_absolute=1.5,
            home_squared=1.0,
            away_squared=0.25,
            total_squared=2.25,
            brier_score=0.10,
            log_loss=0.20,
            confidence_level="high",
            ranking_score=4.8,
        ),
        make_evaluation(
            match_id=2,
            result=False,
            btts=False,
            over_2_5=True,
            double_chance=False,
            exact_score=True,
            home_absolute=0.0,
            away_absolute=1.5,
            total_absolute=1.5,
            home_squared=0.0,
            away_squared=2.25,
            total_squared=2.25,
            brier_score=0.30,
            log_loss=0.60,
            confidence_level="high",
            ranking_score=2.2,
        ),
    ]

    service._evaluate_match = MagicMock(
        side_effect=evaluations
    )

    result = service.run()

    metrics = result["metrics"]

    assert metrics["accuracy"] == {
        "1x2": 50.0,
        "btts": 50.0,
        "over_2_5": 100.0,
        "double_chance": 50.0,
        "exact_score": 50.0,
    }

    assert metrics["mae"] == {
        "home_goals": 0.5,
        "away_goals": 1.0,
        "total_goals": 1.5,
    }

    assert metrics["rmse"] == {
        "home_goals": pytest.approx(0.707),
        "away_goals": pytest.approx(1.118),
        "total_goals": pytest.approx(1.5),
    }

    assert metrics["probability_quality"] == {
        "brier_score": 0.2,
        "log_loss": 0.4,
    }

    assert metrics["confidence_accuracy"]["high"] == {
        "matches": 2,
        "correct": 1,
        "accuracy": 50.0,
    }


def test_run_isolates_failed_match_and_continues():
    service, db = create_service()

    matches = [
        make_match(match_id=1),
        make_match(match_id=2),
    ]

    service._get_finished_matches = MagicMock(
        return_value=matches
    )

    service.pipeline.analyze_match.side_effect = [
        RuntimeError("pipeline failed"),
        {"prediction": 2},
    ]

    service._evaluate_match = MagicMock(
        return_value=make_evaluation(
            match_id=2
        )
    )

    result = service.run()

    assert result["status"] == "success"

    assert result["sample"] == {
        "finished_matches_found": 2,
        "matches_tested": 1,
        "failed": 1,
    }

    db.rollback.assert_called_once_with()

    assert len(result["failures"]) == 1
    assert result["failures"][0]["match_id"] == 1
    assert (
        result["failures"][0]["error_type"]
        == "RuntimeError"
    )
    assert (
        result["failures"][0]["error"]
        == "pipeline failed"
    )

    assert service.pipeline.analyze_match.call_count == 2


def test_run_returns_error_when_all_matches_fail():
    service, db = create_service()

    matches = [
        make_match(match_id=1),
        make_match(match_id=2),
    ]

    service._get_finished_matches = MagicMock(
        return_value=matches
    )

    service.pipeline.analyze_match.side_effect = (
        RuntimeError("failed")
    )

    result = service.run()

    assert result["status"] == "error"

    assert result["sample"] == {
        "finished_matches_found": 2,
        "matches_tested": 0,
        "failed": 2,
    }

    assert len(result["failures"]) == 2
    assert db.rollback.call_count == 2


def test_run_excludes_details_when_disabled():
    service, _ = create_service()

    service._get_finished_matches = MagicMock(
        return_value=[
            make_match(match_id=1)
        ]
    )

    service.pipeline.analyze_match.return_value = {
        "prediction": 1
    }

    service._evaluate_match = MagicMock(
        return_value=make_evaluation(
            match_id=1
        )
    )

    result = service.run(
        include_details=False
    )

    assert result["details"] == []
    assert result["best_predictions"] == []
    assert result["worst_predictions"] == []
    assert (
        result["settings"]["include_details"]
        is False
    )


def test_run_ranks_best_and_worst_predictions():
    service, _ = create_service()

    matches = [
        make_match(match_id=index)
        for index in range(1, 8)
    ]

    service._get_finished_matches = MagicMock(
        return_value=matches
    )

    service.pipeline.analyze_match.side_effect = [
        {"prediction": index}
        for index in range(1, 8)
    ]

    evaluations = [
        make_evaluation(
            match_id=index,
            ranking_score=float(index),
        )
        for index in range(1, 8)
    ]

    service._evaluate_match = MagicMock(
        side_effect=evaluations
    )

    result = service.run()

    assert [
        item["match_id"]
        for item in result["best_predictions"]
    ] == [7, 6, 5, 4, 3]

    assert [
        item["match_id"]
        for item in result["worst_predictions"]
    ] == [1, 2, 3, 4, 5]


@pytest.mark.parametrize(
    (
        "limit",
        "expected",
    ),
    [
        (0, 1),
        (-100, 1),
        (1, 1),
        (500, 500),
        (5000, 1000),
    ],
)
def test_run_bounds_limit(limit, expected):
    service, _ = create_service()

    service._get_finished_matches = MagicMock(
        return_value=[]
    )

    service.run(limit=limit)

    service._get_finished_matches.assert_called_once_with(
        limit=expected
    )


@pytest.mark.parametrize(
    (
        "history_limit",
        "expected",
    ),
    [
        (0, 1),
        (-10, 1),
        (1, 1),
        (10, 10),
        (100, 20),
    ],
)
def test_run_bounds_history_limit(
    history_limit,
    expected,
):
    service, _ = create_service()

    service._get_finished_matches = MagicMock(
        return_value=[
            make_match(match_id=1)
        ]
    )

    service.pipeline.analyze_match.side_effect = (
        RuntimeError("stop")
    )

    service.run(
        history_limit=history_limit
    )

    service.pipeline.analyze_match.assert_called_once()

    assert (
        service.pipeline
        .analyze_match
        .call_args
        .kwargs["history_limit"]
        == expected
    )


@pytest.mark.parametrize(
    (
        "value",
        "field_name",
    ),
    [
        ("invalid", "limit"),
        (None, "limit"),
        ("invalid", "history_limit"),
        (None, "history_limit"),
    ],
)
def test_bounded_integer_rejects_invalid_values(
    value,
    field_name,
):
    service, _ = create_service()

    with pytest.raises(
        ValueError,
        match=field_name,
    ):
        service._bounded_integer(
            value=value,
            minimum=1,
            maximum=100,
            field_name=field_name,
        )


def test_actual_result_supports_home_away_and_draw():
    service, _ = create_service()

    assert service._actual_result(2, 1) == "home_win"
    assert service._actual_result(1, 2) == "away_win"
    assert service._actual_result(1, 1) == "draw"


def test_probability_normalizes_percentages():
    service, _ = create_service()

    assert service._probability(75) == pytest.approx(0.75)
    assert service._probability(0.4) == pytest.approx(0.4)
    assert service._probability(-5) == 0.0
    assert service._probability(500) == 1.0


def test_result_probabilities_are_normalized():
    service, _ = create_service()

    result = service._result_probabilities(
        {
            "home_win": 50,
            "draw": 30,
            "away_win": 20,
        }
    )

    assert result == pytest.approx(
        {
            "home_win": 0.5,
            "draw": 0.3,
            "away_win": 0.2,
        }
    )


def test_result_probabilities_reject_empty_market():
    service, _ = create_service()

    with pytest.raises(ValueError):
        service._result_probabilities({})


def test_binary_pick_normalizes_market():
    service, _ = create_service()

    pick, probabilities = service._binary_pick(
        market={
            "yes": 60,
            "no": 40,
        },
        positive_keys=("yes",),
        negative_keys=("no",),
    )

    assert pick is True
    assert probabilities == {
        "yes": 0.6,
        "no": 0.4,
    }


def test_predicted_score_supports_common_formats():
    service, _ = create_service()

    assert service._predicted_score("2:1") == "2-1"

    assert service._predicted_score(
        {
            "home": 2,
            "away": 1,
        }
    ) == "2-1"

    assert service._predicted_score(
        [3, 2]
    ) == "3-2"

    assert (
        service._predicted_score(None)
        == "not_available"
    )


def test_double_chance_evaluation():
    service, _ = create_service()

    assert service._double_chance_is_correct(
        "1x",
        "home_win",
    )

    assert service._double_chance_is_correct(
        "x2",
        "draw",
    )

    assert not service._double_chance_is_correct(
        "1x",
        "away_win",
    )


def test_brier_and_log_loss_are_finite():
    service, _ = create_service()

    probabilities = {
        "home_win": 0.7,
        "draw": 0.2,
        "away_win": 0.1,
    }

    brier = service._multiclass_brier_score(
        probabilities,
        "home_win",
    )

    log_loss = service._multiclass_log_loss(
        probabilities,
        "home_win",
    )

    assert brier >= 0.0
    assert log_loss >= 0.0
