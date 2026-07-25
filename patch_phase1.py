import os
import re
import uuid

# 1. Update banking_auth.py
auth_file = "C:\\Users\\motis\\Downloads\\fastapi\\Unified-Cyber-Fraud-Intelligence-Platform\\api\\platform\\banking_auth.py"
with open(auth_file, "r") as f:
    auth_content = f.read()

supabase_import = "from supabase import create_client, Client\n"
if "from supabase" not in auth_content:
    auth_content = supabase_import + auth_content

supabase_init = """
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "")
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
"""
if "create_client" not in auth_content:
    auth_content = auth_content.replace("class BankingAuthService:", supabase_init + "\nclass BankingAuthService:")

login_req = """class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=8, max_length=256)
    device_id: str = Field(min_length=1, max_length=256)
    email: str | None = None
    device_fingerprint: str | None = None
    device_model: str | None = None
    device_manufacturer: str | None = None
    android_version: str | None = None"""
auth_content = re.sub(r'class LoginRequest\(BaseModel\):.*?    email: str \| None = None', login_req, auth_content, flags=re.DOTALL)

login_endpoint_replace = """    security = identity_trust.evaluate_login(
        customer=profile,
        device_id=payload.device_id,
        request=request,
        device={
            "device_uuid": payload.device_id,
            "fingerprint": payload.device_fingerprint or "",
            "model": payload.device_model or "unknown",
            "manufacturer": payload.device_manufacturer or "unknown",
            "android_version": payload.android_version or "unknown"
        },
    )"""
auth_content = re.sub(r'    security = identity_trust\.evaluate_login\(.*?        device={"device_uuid": payload\.device_id},\n    \)', login_endpoint_replace, auth_content, flags=re.DOTALL)

# Add supabase logic to login method
login_method = """
    def login(self, request: LoginRequest) -> tuple[TokenPair, dict[str, Any]]:
        if supabase:
            response = supabase.auth.sign_in_with_password({"email": request.email or request.username + "@fusionbank.com", "password": request.password})
            if not response.user:
                raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user = self.authenticate(request.username, request.password)
        new_device = request.device_id not in user.get("registered_devices", [])
        if new_device:
            user.setdefault("registered_devices", []).append(request.device_id)
        user.setdefault("active_sessions", []).append({"device_id": request.device_id, "login_at": int(time.time()), "status": "ACTIVE"})
        put(USER_COLLECTION, user["username"], user)
        profile = self._public_profile(user)
        profile["new_device"] = new_device
        return self._issue(user, request.device_id), profile
"""
auth_content = re.sub(r'    def login\(self, request: LoginRequest\) -> tuple\[TokenPair, dict\[str, Any\]\]:.*?        return self\._issue\(user, request\.device_id\), profile', login_method.strip(), auth_content, flags=re.DOTALL)


with open(auth_file, "w") as f:
    f.write(auth_content)


# 2. Update service.py for transaction_profiles (Behavioural Profiling)
service_file = "C:\\Users\\motis\\Downloads\\fastapi\\Unified-Cyber-Fraud-Intelligence-Platform\\api\\identity_trust\\service.py"
with open(service_file, "r") as f:
    service_content = f.read()

record_activity_replace = """    def record_activity(self, *, sdk_session_id: str, event_type: str, user_id: str, device_id: str, risk_delta: float = 0, metadata: dict[str, Any] | None = None) -> dict[str, Any] | None:
        rows = [row for row in list_all("active_sessions") if row.get("sdk_session_id") == sdk_session_id or row.get("session_uuid") == sdk_session_id]
        if not rows:
            return None
        row = rows[-1]
        row["risk_score"] = min(100.0, max(0.0, float(row.get("risk_score", 0)) + risk_delta))
        row["threat_count"] = int(row.get("threat_count", 0)) + (1 if risk_delta > 0 else 0)
        row["last_seen_at"] = _now(); row["updated_at"] = _now()
        put("active_sessions", row.get("session_uuid", sdk_session_id), row)
        self._write("risk_scores", {"id": str(uuid.uuid4()), "customer_id": row.get("customer_id"), "session_id": row.get("id"), "score": row["risk_score"], "device_score": None, "network_score": None, "behaviour_score": max(0, 80 - risk_delta), "threat_score": row["threat_count"] * 20, "transaction_score": risk_delta if event_type in {"TRANSFER", "QR_PAYMENT", "BENEFICIARY_ADDED"} else 0, "explanation": {"event_type": event_type, "metadata": metadata or {}}, "calculated_at": _now(), "created_at": _now(), "updated_at": _now()})
        
        # Update behavioural profiling (transaction_profiles)
        if event_type in {"TRANSFER", "QR_PAYMENT"} and metadata and "amount" in metadata:
            amount = float(metadata["amount"])
            customer_id = row.get("customer_id")
            profiles = list_all("transaction_profiles")
            profile = next((p for p in profiles if p.get("customer_id") == customer_id), None)
            if profile:
                count = profile.get("transaction_count", 0) + 1
                avg = profile.get("avg_transaction_amount", 0)
                profile["avg_transaction_amount"] = ((avg * (count - 1)) + amount) / count
                profile["max_transaction_amount"] = max(profile.get("max_transaction_amount", 0), amount)
                profile["transaction_count"] = count
                profile["updated_at"] = _now()
                put("transaction_profiles", profile["id"], profile)
            else:
                self._write("transaction_profiles", {
                    "id": str(uuid.uuid4()),
                    "customer_id": customer_id,
                    "avg_transaction_amount": amount,
                    "max_transaction_amount": amount,
                    "transaction_count": 1,
                    "created_at": _now(),
                    "updated_at": _now()
                })
        
        return row"""
service_content = re.sub(r'    def record_activity\(self.*?return row', record_activity_replace, service_content, flags=re.DOTALL)

with open(service_file, "w") as f:
    f.write(service_content)

# 3. Update pipeline.py to pass amount in metadata for record_activity
pipeline_file = "C:\\Users\\motis\\Downloads\\fastapi\\Unified-Cyber-Fraud-Intelligence-Platform\\api\\platform\\pipeline.py"
with open(pipeline_file, "r") as f:
    pipeline_content = f.read()

if "from api.identity_trust.service import identity_trust" not in pipeline_content:
    pipeline_content = pipeline_content.replace("from api.sdk_engine import FusionAdaptiveTrustSDKEngine, sdk_engine", "from api.sdk_engine import FusionAdaptiveTrustSDKEngine, sdk_engine\nfrom api.identity_trust.service import identity_trust")

pipeline_replace = """        inference = self.model_runtime.infer(
            event,
            threats=all_threats,
            graph_findings=graph_payload["findings"],
        )
        decision = self.decision_engine.decide(inference, all_threats)
        decision["session_id"] = event["session_id"]
        
        # Record activity
        if event["event_type"] in {"TRANSFER", "QR_PAYMENT"}:
            identity_trust.record_activity(
                sdk_session_id=event["session_id"],
                event_type=event["event_type"],
                user_id=event.get("user_id", "unknown"),
                device_id=event.get("device_id", "unknown"),
                risk_delta=10.0 if all_threats else 0.0,
                metadata={"amount": event.get("amount", 0.0)}
            )"""
pipeline_content = re.sub(r'        inference = self\.model_runtime\.infer\(.*?decision\["session_id"\] = event\["session_id"\]', pipeline_replace, pipeline_content, flags=re.DOTALL)

with open(pipeline_file, "w") as f:
    f.write(pipeline_content)

print("Patch applied successfully.")
