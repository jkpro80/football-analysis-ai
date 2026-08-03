from fastapi.testclient import TestClient

def test_prediction_endpoint(client: TestClient):
    response = client.get("/predict/16")

    print(response.status_code)
    print(response.json())

    assert response.status_code == 200
    