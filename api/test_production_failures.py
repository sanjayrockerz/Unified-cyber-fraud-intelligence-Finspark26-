from __future__ import annotations

from fastapi import HTTPException

from api.core_platform.config import PlatformSettings
from api.core_platform.graph_runtime import GraphRuntime
from api.core_platform.security import create_access_token, validate_access_token


class OfflineGraphRepository:
    backend_name = "NEO4J"

    def verify_connectivity(self):
        raise ConnectionError("offline")

    def observe(self, event):
        raise ConnectionError("offline")

    def analyze(self, event):
        raise AssertionError("analyze must not run after failed observation")

    def topology(self, limit):
        raise ConnectionError("offline")


def test_expired_access_token_is_rejected():
    settings = PlatformSettings(
        jwt_ttl_seconds=-1,
        jwt_secret="test-secret-that-is-longer-than-thirty-two-bytes",
    )
    token, _ = create_access_token(
        "expired-test",
        {"roles": ["sdk"]},
        settings,
    )
    try:
        validate_access_token(token, settings)
    except HTTPException as exception:
        assert exception.status_code == 401
        assert "expired" in str(exception.detail).lower()
    else:
        raise AssertionError("Expired token unexpectedly validated")


def test_neo4j_runtime_failure_is_explicit_and_does_not_crash():
    runtime = GraphRuntime.__new__(GraphRuntime)
    runtime.repository = OfflineGraphRepository()
    runtime.error_code = None
    runtime.settings = PlatformSettings()
    result = runtime.process(
        {
            "session_id": "failure-session",
            "event_type": "TRANSFER_INITIATED",
            "user_id": "failure-user",
        }
    )
    assert result.status == "FAILED"
    assert result.backend == "NEO4J"
    assert result.error_code == "GRAPH_QUERY_FAILED"
    topology = runtime.topology()
    assert topology["status"] == "FAILED"
    assert topology["error_code"] == "GRAPH_TOPOLOGY_QUERY_FAILED"


def test_client_without_tenant_scope_still_issues_a_usable_token(monkeypatch):
    """The deployed dashboard client is configured with only a secret and roles.

    Without a tenant fallback create_access_token emitted tenant_id=None, and
    validate_access_token then rejected the token with "missing required
    claims" -- so /auth/token succeeded while every authenticated endpoint
    returned 401 and every dashboard page rendered its error state.
    """
    monkeypatch.setenv("FUSION_DEFAULT_TENANT_ID", "TENANT_FUSB_001")
    monkeypatch.setenv("FUSION_DEFAULT_APP_ID", "com.fuzenbank.mobileapp")
    settings = PlatformSettings(
        jwt_secret="test-secret-that-is-longer-than-thirty-two-bytes",
    )
    token, _ = create_access_token(
        "fusion-dashboard-prod",
        {"secret": "unused", "roles": ["analyst", "operator", "developer"]},
        settings,
    )
    context = validate_access_token(token, settings)
    assert context.tenant_id == "TENANT_FUSB_001"
    assert context.app_id == "com.fuzenbank.mobileapp"


def test_explicit_client_tenant_scope_is_never_overridden(monkeypatch):
    """A client that declares its own tenant keeps it -- the fallback only
    fills the gap, it must not widen or rewrite a configured scope."""
    monkeypatch.setenv("FUSION_DEFAULT_TENANT_ID", "TENANT_FUSB_001")
    settings = PlatformSettings(
        jwt_secret="test-secret-that-is-longer-than-thirty-two-bytes",
    )
    token, _ = create_access_token(
        "scoped-client",
        {"roles": ["sdk"], "tenant_id": "TENANT_OTHER_009", "app_id": "com.other.app"},
        settings,
    )
    context = validate_access_token(token, settings)
    assert context.tenant_id == "TENANT_OTHER_009"
    assert context.app_id == "com.other.app"
