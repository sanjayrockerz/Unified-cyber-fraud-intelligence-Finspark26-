import pytest
from fastapi.testclient import TestClient
from api.main import app
from api import store

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_settings_before_each_test():
    """Clear saved settings before each test so defaults are returned."""
    # Delete any previously saved settings
    try:
        store.delete("settings", "policy")
    except Exception:
        pass  # It's OK if the key doesn't exist
    yield
    # Optionally clean up after test too
    try:
        store.delete("settings", "policy")
    except Exception:
        pass


def get_dev_token() -> str:
    """Get a valid dev token from the auth endpoint, following the authenticated path.
    Uses fusion-dashboard-dev which has analyst/operator/developer roles matching DEFAULT_ROLES."""
    response = client.post(
        "/auth/token",
        json={"client_id": "test-dashboard-client", "client_secret": "test-dashboard-secret"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_get_settings_policy_returns_defaults_when_unset():
    token = get_dev_token()
    response = client.get(
        "/settings/policy",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["block_threshold"] == 75
    assert body["challenge_threshold"] == 50
    assert body["window_seconds"] == 300


def test_put_then_get_settings_policy_roundtrips():
    token = get_dev_token()
    payload = {"block_threshold": 80, "challenge_threshold": 55, "window_seconds": 120}
    put_response = client.put(
        "/settings/policy",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert put_response.status_code == 200
    assert put_response.json()["data"] == payload

    get_response = client.get(
        "/settings/policy",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert get_response.json()["data"] == payload
