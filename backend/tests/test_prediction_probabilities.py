from fastapi.testclient import TestClient


def test_prediction_probabilities(client: TestClient):
    response = client.get("/predictions/16")

    assert response.status_code == 200

    data = response.json()
    prediction = data["prediction"]

    total = (
        prediction["home_win"]
        + prediction["draw"]
        + prediction["away_win"]
    )

    assert abs(total - 100) < 0.1
