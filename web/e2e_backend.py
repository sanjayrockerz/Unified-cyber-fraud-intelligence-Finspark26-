"""Local Playwright backend launcher; production deployments do not use this."""

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault("JWT_SECRET_KEY", "rc1-e2e-secret-key-32-bytes-minimum!!")
os.environ.setdefault("DATABASE_URL", "sqlite:///finspark.db")
os.environ.setdefault("FUSION_BANK_USERS_JSON", json.dumps({"e2e_user": {"password": "E2EConfiguredPass123!", "role": "admin", "tenant_id": "TENANT_FUSB_001"}}))
os.environ.setdefault("FUSION_AUTH_CLIENTS_JSON", json.dumps({
    "e2e-dashboard": {"secret": "e2e-dashboard-secret", "roles": ["analyst", "operator", "developer"], "tenant_id": "TENANT_FUSB_001"},
    "e2e-sdk": {"secret": "e2e-sdk-secret", "roles": ["sdk"], "tenant_id": "TENANT_FUSB_001", "app_id": "com.fuzenbank.mobileapp"},
}))
# Keep the local browser harness responsive. Large synthetic fixtures are
# generated explicitly by the simulation tests, never during server boot.
os.environ["SEED_DEMO_SCALE"] = "0"

import uvicorn

uvicorn.run("api.main:app", host="127.0.0.1", port=8000, log_level="warning")
