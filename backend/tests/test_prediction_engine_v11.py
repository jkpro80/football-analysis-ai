from unittest.mock import MagicMock

import pytest

from app.engine.prediction_engine_v11 import (
    MatchNotFoundError,
    PredictionEngineError,
    PredictionEngineV11,
)


def create_engine(
    *,
    data_service=None,
    feature_engineering=None,
):
    return PredictionEngineV11(
        db=MagicMock(),
        data_service=data_service or MagicMock(),
        feature_engineering=feature_engineering or MagicMock(),
    )


def test_v11_requires_database_session():
    with pytest.raises(
        ValueError,
        match="جلسة قاعدة البيانات",
    ):
        PredictionEngineV11(db=None)


def test_v11_model_metadata():
    assert PredictionEngineV11.MODEL_NAME == (
        "Prediction Engine V11"
    )
    assert PredictionEngineV11.VERSION == "11.4.0"


@pytest.mark.parametrize(
    "match_id",
    [
        0,
        -1,
        -100,
    ],
)
def test_v11_rejects_non_positive_match_id(match_id):
    engine = create_engine()

    with pytest.raises(ValueError):
        engine.predict(match_id=match_id)


@pytest.mark.parametrize(
    "match_id",
    [
        None,
        True,
        False,
        "invalid",
        1.5,
    ],
)
def test_v11_rejects_invalid_match_id_type(match_id):
    engine = create_engine()

    with pytest.raises((TypeError, ValueError)):
        engine.predict(match_id=match_id)


def test_v11_match_not_found():
    data_service = MagicMock()
    data_service.get_match_data.return_value = None

    engine = create_engine(
        data_service=data_service,
    )

    with pytest.raises(MatchNotFoundError):
        engine.predict(match_id=999999)

    data_service.get_match_data.assert_called_once_with(
        999999
    )


def test_v11_wraps_data_loading_failure():
    data_service = MagicMock()
    data_service.get_match_data.side_effect = RuntimeError(
        "database unavailable"
    )

    engine = create_engine(
        data_service=data_service,
    )

    with pytest.raises(PredictionEngineError) as exc_info:
        engine.predict(match_id=16)

    error = exc_info.value

    assert error.stage == "data_loading"
    assert "database unavailable" in str(error)


def test_v11_wraps_feature_engineering_failure():
    data_service = MagicMock()
    data_service.get_match_data.return_value = {
        "match": {"id": 16},
    }

    feature_engineering = MagicMock()
    feature_engineering.build.side_effect = RuntimeError(
        "feature failure"
    )

    engine = create_engine(
        data_service=data_service,
        feature_engineering=feature_engineering,
    )

    with pytest.raises(PredictionEngineError) as exc_info:
        engine.predict(match_id=16)

    error = exc_info.value

    assert error.stage == "feature_engineering"
    assert "feature failure" in str(error)

    feature_engineering.build.assert_called_once_with(
        data_service.get_match_data.return_value
    )


def test_v11_rejects_non_dictionary_features():
    data_service = MagicMock()
    data_service.get_match_data.return_value = {
        "match": {"id": 16},
    }

    feature_engineering = MagicMock()
    feature_engineering.build.return_value = []

    engine = create_engine(
        data_service=data_service,
        feature_engineering=feature_engineering,
    )

    with pytest.raises(PredictionEngineError) as exc_info:
        engine.predict(match_id=16)

    error = exc_info.value

    assert error.stage == "feature_engineering"
    assert "قاموس" in str(error)
