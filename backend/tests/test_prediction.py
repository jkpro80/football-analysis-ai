from fastapi.testclient import TestClient


def test_prediction_endpoint(client: TestClient):
    response = client.get("/predictions/16")

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "engine" in data
    assert "match" in data
    assert "prediction" in data
    assert "expected_goals" in data
    assert "confidence" in data
