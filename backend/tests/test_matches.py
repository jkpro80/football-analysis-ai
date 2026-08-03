from fastapi.testclient import TestClient

def test_matches_endpoint(client: TestClient):
    response = client.get("/matches")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) > 0
    assert "id" in data[0]
    assert "home_team" in data[0]
    assert "away_team" in data[0]
