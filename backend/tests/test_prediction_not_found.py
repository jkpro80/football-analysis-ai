from fastapi.testclient import TestClient

def test_prediction_not_found(client: TestClient):
    response = client.get("/predict/999999")

    assert response.status_code == 404

    data = response.json()

    assert "detail" in data
