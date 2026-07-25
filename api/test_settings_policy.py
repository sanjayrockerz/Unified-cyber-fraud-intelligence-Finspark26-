from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)


def test_get_settings_policy_returns_defaults_when_unset():
    response = client.get("/settings/policy")
    assert response.status_code == 200
    body = response.json()
    assert body["block_threshold"] == 75
    assert body["challenge_threshold"] == 50
    assert body["window_seconds"] == 300


def test_put_then_get_settings_policy_roundtrips():
    payload = {"block_threshold": 80, "challenge_threshold": 55, "window_seconds": 120}
    put_response = client.put("/settings/policy", json=payload)
    assert put_response.status_code == 200
    assert put_response.json() == payload

    get_response = client.get("/settings/policy")
    assert get_response.json() == payload
