from fastapi.testclient import TestClient

def test_prediction_probabilities(client: TestClient):
    response = client.get("/predict/16")

    assert response.status_code == 200

    data = response.json()

    probs = data["probabilities"]

    total = (
        probs["home_win"]
        + probs["draw"]
        + probs["away_win"]
    )

    assert abs(total - 100) < 0.1
