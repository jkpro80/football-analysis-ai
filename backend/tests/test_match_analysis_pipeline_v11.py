from unittest.mock import MagicMock

import pytest

from app.services.match_analysis_pipeline_v11 import (
    MatchAnalysisPipelineV11,
)


def create_pipeline():
    db = MagicMock()

    pipeline = MatchAnalysisPipelineV11.__new__(
        MatchAnalysisPipelineV11
    )

    pipeline._owns_session = False
    pipeline.db = db
    pipeline.prediction_service = MagicMock()
    pipeline.feature_store_service = MagicMock()
    pipeline.prediction_tracking_service = MagicMock()

    return pipeline, db


def valid_prediction():
    return {
        "model": "Prediction Engine V11",
        "features": {
            "home_attack": 1.25,
            "away_attack": 0.95,
        },
        "probabilities": {
            "home_win": 45.0,
            "draw": 30.0,
            "away_win": 25.0,
        },
    }


@pytest.mark.parametrize(
    "match_id",
    [
        None,
        True,
        False,
        "1",
        1.5,
    ],
)
def test_pipeline_rejects_invalid_match_id_type(match_id):
    pipeline, db = create_pipeline()

    with pytest.raises(TypeError):
        pipeline.analyze_match(match_id)

    pipeline.prediction_service.predict_match.assert_not_called()
    db.commit.assert_not_called()
    db.rollback.assert_not_called()


@pytest.mark.parametrize(
    "match_id",
    [
        0,
        -1,
        -100,
    ],
)
def test_pipeline_rejects_non_positive_match_id(match_id):
    pipeline, db = create_pipeline()

    with pytest.raises(ValueError):
        pipeline.analyze_match(match_id)

    pipeline.prediction_service.predict_match.assert_not_called()
    db.commit.assert_not_called()
    db.rollback.assert_not_called()


@pytest.mark.parametrize(
    "history_limit",
    [
        None,
        True,
        False,
        "5",
        1.5,
    ],
)
def test_pipeline_rejects_invalid_history_limit_type(
    history_limit,
):
    pipeline, db = create_pipeline()

    with pytest.raises(TypeError):
        pipeline.analyze_match(
            match_id=1,
            history_limit=history_limit,
        )

    pipeline.prediction_service.predict_match.assert_not_called()
    db.commit.assert_not_called()
    db.rollback.assert_not_called()


@pytest.mark.parametrize(
    "history_limit",
    [
        0,
        -1,
        -5,
    ],
)
def test_pipeline_rejects_non_positive_history_limit(
    history_limit,
):
    pipeline, db = create_pipeline()

    with pytest.raises(ValueError):
        pipeline.analyze_match(
            match_id=1,
            history_limit=history_limit,
        )

    pipeline.prediction_service.predict_match.assert_not_called()
    db.commit.assert_not_called()
    db.rollback.assert_not_called()


def test_pipeline_runs_successfully_and_persists_results():
    pipeline, db = create_pipeline()
    prediction = valid_prediction()

    pipeline.prediction_service.predict_match.return_value = (
        prediction
    )

    result = pipeline.analyze_match(
        match_id=42,
        history_limit=7,
        max_goals=9,
        top_scores_count=6,
        feature_version="Feature Engineering V11 Test",
        replace_existing_features=False,
    )

    pipeline.prediction_service.predict_match.assert_called_once_with(
        match_id=42,
        history_limit=7,
        max_goals=9,
        top_scores_count=6,
        include_features=True,
        include_score_matrix=False,
        include_raw_data=False,
    )

    pipeline.feature_store_service.save_features.assert_called_once_with(
        match_id=42,
        features=prediction["features"],
        feature_version="Feature Engineering V11 Test",
        replace_existing=False,
    )

    (
        pipeline.prediction_tracking_service
        .save_prediction
        .assert_called_once_with(
            prediction=prediction,
            match_id=42,
        )
    )

    db.commit.assert_called_once_with()
    db.rollback.assert_not_called()

    assert result is prediction
    assert result["pipeline"]["name"] == "MatchAnalysisPipelineV11"
    assert result["pipeline"]["status"] == "completed"
    assert result["pipeline"]["match_id"] == 42
    assert result["pipeline"]["model"] == "Prediction Engine V11"
    assert result["pipeline"]["history_limit"] == 7
    assert (
        result["pipeline"]["feature_version"]
        == "Feature Engineering V11 Test"
    )
    assert result["pipeline"]["features_saved"] is True
    assert result["pipeline"]["prediction_saved"] is True
    assert isinstance(result["pipeline"]["elapsed_ms"], float)
    assert result["pipeline"]["elapsed_ms"] >= 0


def test_pipeline_can_skip_feature_persistence():
    pipeline, db = create_pipeline()
    prediction = valid_prediction()

    pipeline.prediction_service.predict_match.return_value = (
        prediction
    )

    result = pipeline.analyze_match(
        match_id=10,
        save_features=False,
    )

    pipeline.feature_store_service.save_features.assert_not_called()

    (
        pipeline.prediction_tracking_service
        .save_prediction
        .assert_called_once()
    )

    db.commit.assert_called_once_with()
    db.rollback.assert_not_called()

    assert result["pipeline"]["features_saved"] is False
    assert result["pipeline"]["prediction_saved"] is True


def test_pipeline_can_skip_prediction_persistence():
    pipeline, db = create_pipeline()
    prediction = valid_prediction()

    pipeline.prediction_service.predict_match.return_value = (
        prediction
    )

    result = pipeline.analyze_match(
        match_id=10,
        save_prediction=False,
    )

    pipeline.feature_store_service.save_features.assert_called_once()

    (
        pipeline.prediction_tracking_service
        .save_prediction
        .assert_not_called()
    )

    db.commit.assert_called_once_with()
    db.rollback.assert_not_called()

    assert result["pipeline"]["features_saved"] is True
    assert result["pipeline"]["prediction_saved"] is False


def test_pipeline_can_skip_all_persistence():
    pipeline, db = create_pipeline()
    prediction = valid_prediction()

    pipeline.prediction_service.predict_match.return_value = (
        prediction
    )

    result = pipeline.analyze_match(
        match_id=10,
        save_features=False,
        save_prediction=False,
    )

    pipeline.feature_store_service.save_features.assert_not_called()

    (
        pipeline.prediction_tracking_service
        .save_prediction
        .assert_not_called()
    )

    db.commit.assert_called_once_with()
    db.rollback.assert_not_called()

    assert result["pipeline"]["features_saved"] is False
    assert result["pipeline"]["prediction_saved"] is False


def test_pipeline_rolls_back_when_prediction_service_fails():
    pipeline, db = create_pipeline()

    pipeline.prediction_service.predict_match.side_effect = (
        RuntimeError("prediction failed")
    )

    with pytest.raises(
        RuntimeError,
        match="prediction failed",
    ):
        pipeline.analyze_match(match_id=5)

    db.commit.assert_not_called()
    db.rollback.assert_called_once_with()

    pipeline.feature_store_service.save_features.assert_not_called()

    (
        pipeline.prediction_tracking_service
        .save_prediction
        .assert_not_called()
    )


def test_pipeline_rolls_back_when_feature_persistence_fails():
    pipeline, db = create_pipeline()
    prediction = valid_prediction()

    pipeline.prediction_service.predict_match.return_value = (
        prediction
    )

    pipeline.feature_store_service.save_features.side_effect = (
        RuntimeError("feature save failed")
    )

    with pytest.raises(
        RuntimeError,
        match="feature save failed",
    ):
        pipeline.analyze_match(match_id=5)

    db.commit.assert_not_called()
    db.rollback.assert_called_once_with()

    (
        pipeline.prediction_tracking_service
        .save_prediction
        .assert_not_called()
    )


def test_pipeline_rolls_back_when_prediction_persistence_fails():
    pipeline, db = create_pipeline()
    prediction = valid_prediction()

    pipeline.prediction_service.predict_match.return_value = (
        prediction
    )

    (
        pipeline.prediction_tracking_service
        .save_prediction
        .side_effect
    ) = RuntimeError("tracking failed")

    with pytest.raises(
        RuntimeError,
        match="tracking failed",
    ):
        pipeline.analyze_match(match_id=5)

    db.commit.assert_not_called()
    db.rollback.assert_called_once_with()


@pytest.mark.parametrize(
    "prediction",
    [
        None,
        [],
        "invalid",
        123,
    ],
)
def test_pipeline_rejects_non_dictionary_prediction(
    prediction,
):
    pipeline, db = create_pipeline()

    pipeline.prediction_service.predict_match.return_value = (
        prediction
    )

    with pytest.raises(TypeError):
        pipeline.analyze_match(match_id=5)

    db.commit.assert_not_called()
    db.rollback.assert_called_once_with()


@pytest.mark.parametrize(
    "features",
    [
        None,
        [],
        "invalid",
        123,
    ],
)
def test_pipeline_rejects_invalid_features(features):
    pipeline, db = create_pipeline()

    prediction = valid_prediction()
    prediction["features"] = features

    pipeline.prediction_service.predict_match.return_value = (
        prediction
    )

    with pytest.raises(RuntimeError):
        pipeline.analyze_match(match_id=5)

    pipeline.feature_store_service.save_features.assert_not_called()

    (
        pipeline.prediction_tracking_service
        .save_prediction
        .assert_not_called()
    )

    db.commit.assert_not_called()
    db.rollback.assert_called_once_with()


def test_close_does_not_close_external_session():
    pipeline, db = create_pipeline()

    pipeline._owns_session = False
    pipeline.close()

    db.close.assert_not_called()


def test_close_closes_owned_session():
    pipeline, db = create_pipeline()

    pipeline._owns_session = True
    pipeline.close()

    db.close.assert_called_once_with()


def test_context_manager_returns_pipeline():
    pipeline, _ = create_pipeline()

    assert pipeline.__enter__() is pipeline
