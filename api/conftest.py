"""Explicit production-contract configuration for backend tests."""

import json
import os

os.environ.setdefault("JWT_SECRET_KEY", "rc1-test-secret-key-32-bytes-minimum!!")
os.environ.setdefault("DATABASE_URL", "sqlite:///finspark.db")
os.environ.setdefault(
    "FUSION_BANK_USERS_JSON",
    json.dumps({"test_user": {"password": "ConfiguredPass123!", "role": "admin", "tenant_id": "TENANT_FUSB_001"}}),
)
os.environ.setdefault(
    "FUSION_AUTH_CLIENTS_JSON",
    json.dumps({
        "test-android-client": {"secret": "test-android-secret", "roles": ["sdk"], "tenant_id": "TENANT_FUSB_001"},
        "test-dashboard-client": {"secret": "test-dashboard-secret", "roles": ["analyst", "operator", "developer"], "tenant_id": "TENANT_FUSB_001"},
    }),
)
