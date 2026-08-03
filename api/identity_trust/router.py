from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from api.core_platform.banking_auth import LoginRequest, RegisterRequest, banking_auth
from api.store import list_all
from .service import identity_trust
from .supabase import SupabaseError, supabase_rest


router = APIRouter(prefix="/identity", tags=["Identity Trust"])


class RegistrationPayload(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    mobile_number: str = Field(min_length=7, max_length=32)
    password: str = Field(min_length=8, max_length=256)
    customer_id: str | None = None
    account_number: str | None = None
    device_uuid: str | None = None
    device_fingerprint: str = ""
    device_model: str = "unknown"
    device_manufacturer: str = "unknown"
    android_version: str = "unknown"
    sdk_version: str = "unknown"
    app_version: str = "unknown"


class PasswordResetPayload(BaseModel):
    email: EmailStr


@router.post("/register", status_code=201)
async def register_identity(payload: RegistrationPayload):
    banking_profile = banking_auth.register(RegisterRequest(
        username=str(payload.email), password=payload.password, email=str(payload.email),
        display_name=payload.full_name, phone=payload.mobile_number,
        customer_id=payload.customer_id, account_number=payload.account_number,
        device_uuid=payload.device_uuid, device_fingerprint=payload.device_fingerprint,
        device_model=payload.device_model, device_manufacturer=payload.device_manufacturer,
        android_version=payload.android_version, sdk_version=payload.sdk_version, app_version=payload.app_version,
    ))
    result = identity_trust.register_customer(
        username=payload.email,
        password=payload.password,
        email=str(payload.email),
        display_name=payload.full_name,
        phone=payload.mobile_number,
        customer_id=payload.customer_id,
        account_number=payload.account_number,
        device={
            "device_uuid": payload.device_uuid,
            "fingerprint": payload.device_fingerprint,
            "model": payload.device_model,
            "manufacturer": payload.device_manufacturer,
            "android_version": payload.android_version,
            "sdk_version": payload.sdk_version,
            "app_version": payload.app_version,
        } if payload.device_uuid else None,
    )
    return {"customer": {**result["customer"], "user_id": banking_profile.get("user_id")}, "email_verification_required": result["email_verification_required"]}


@router.post("/login")
async def login_identity(payload: LoginRequest, request: Request):
    supabase_auth = None
    if supabase_rest.enabled:
        customer_rows = supabase_rest.select("customers", filters={"email": f"eq.{payload.username.lower()}"}, limit=1)
        if not customer_rows:
            raise HTTPException(status_code=401, detail="Identity is not registered")
        try:
            supabase_auth = supabase_rest.auth_password_signin(payload.username.lower(), payload.password)
        except SupabaseError as exc:
            raise HTTPException(status_code=401, detail="Supabase authentication failed") from exc
    pair, profile = banking_auth.login(payload)
    security = identity_trust.evaluate_login(customer=profile, device_id=payload.device_id, request=request, device={"device_uuid": payload.device_id})
    return {**pair.to_dict(), "profile": profile, "security": security, "supabase": {"user_id": (supabase_auth or {}).get("user", {}).get("id") if supabase_auth else None, "email_verified": bool((supabase_auth or {}).get("user", {}).get("email_confirmed_at")) if supabase_auth else False}}


@router.post("/password-reset")
async def password_reset(payload: PasswordResetPayload):
    if not supabase_rest.enabled:
        raise HTTPException(status_code=503, detail="Supabase Auth is not configured")
    try:
        supabase_rest.auth_password_reset(str(payload.email))
    except SupabaseError as exc:
        raise HTTPException(status_code=502, detail="Unable to request password reset") from exc
    return {"status": "REQUESTED"}


@router.get("/security/overview")
async def security_overview(request: Request):
    sessions = list_all("active_sessions")[-100:][::-1]
    events = list_all("security_events")[-100:][::-1]
    notifications = list_all("email_logs")[-100:][::-1]
    return {
        "sessions": sessions,
        "security_events": events,
        "email_logs": notifications,
        "active_sessions": len([item for item in sessions if item.get("status") in {"ACTIVE", "SUSPICIOUS"}]),
        "suspicious_sessions": len([item for item in sessions if item.get("status") == "SUSPICIOUS"]),
        "last_updated_at": sessions[0].get("updated_at") if sessions else None,
    }
