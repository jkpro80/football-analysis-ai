from fastapi.testclient import TestClient

def test_teams_endpoint(client: TestClient):
    response = client.get("/teams")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0
    assert "id" in data[0]
    assert "name" in data[0]
