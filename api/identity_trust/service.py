from __future__ import annotations

import ipaddress
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import Request

from api.core_platform.events import platform_event_broker
from api.core_platform.notifications import notification_service
from api.store import get, list_all, put
from api.geo_utils import haversine_km, lookup_ip

from .config import identity_settings
from .email import security_email_service
from .supabase import SupabaseError, supabase_rest


SECURITY_COLLECTION = "identity_security_events"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    value = forwarded.split(",", 1)[0].strip() if forwarded else (request.client.host if request.client else "")
    try:
        ipaddress.ip_address(value)
        return value
    except ValueError:
        return ""


class IdentityTrustService:
    def _resolve_customer(self, customer: dict[str, Any]) -> dict[str, Any]:
        customer_key = customer.get("customer_id") or customer.get("user_id")
        if supabase_rest.enabled and customer_key:
            try:
                rows = supabase_rest.select("customers", filters={"customer_id": f"eq.{customer_key}"}, limit=1)
                if rows:
                    return {**customer, **rows[0], "id": rows[0].get("id")}
            except SupabaseError:
                if identity_settings.strict_supabase:
                    raise
        for row in list_all("customers"):
            if row.get("customer_id") in {customer_key, customer.get("user_id")} or row.get("email") == customer.get("email"):
                return {**customer, **row}
        return customer

    def _resolve_device(self, *, customer_id: str | None, device_id: str, device: dict[str, Any], known: bool) -> str:
        if not supabase_rest.enabled or not customer_id:
            return device_id
        try:
            rows = supabase_rest.select("registered_devices", filters={"device_uuid": f"eq.{device_id}"}, limit=1)
            if rows:
                return rows[0]["id"]
            row = self._write("registered_devices", {"id": str(uuid.uuid4()), "customer_id": customer_id, "device_uuid": device_id, "device_fingerprint": device.get("fingerprint", ""), "model": device.get("model", "unknown"), "manufacturer": device.get("manufacturer", "unknown"), "android_version": device.get("android_version", "unknown"), "sdk_version": device.get("sdk_version", "unknown"), "app_version": device.get("app_version", "unknown"), "root_detected": bool(device.get("root_detected", False)), "emulator_detected": bool(device.get("emulator_detected", False)), "known_device": known, "trust_score": 85 if known else 45, "created_at": _now(), "updated_at": _now()})
            return row["id"]
        except SupabaseError:
            if identity_settings.strict_supabase:
                raise
            return device_id

    def _write(self, table: str, row: dict[str, Any], collection: str | None = None) -> dict[str, Any]:
        if supabase_rest.enabled:
            try:
                return supabase_rest.insert(table, row)
            except SupabaseError:
                if identity_settings.strict_supabase:
                    raise
        key = str(row.get("id") or row.get("session_uuid") or row.get("device_uuid") or uuid.uuid4())
        put(collection or table, key, {**row, "id": key})
        return {**row, "id": key}

    def register_customer(self, *, username: str, password: str, email: str, display_name: str, phone: str, customer_id: str | None = None, account_number: str | None = None, device: dict[str, Any] | None = None) -> dict[str, Any]:
        customer_id = customer_id or f"CUS_{uuid.uuid4().hex[:12].upper()}"
        account_number = account_number or f"FUS-{uuid.uuid4().hex[:12].upper()}"
        auth_user_id = None
        if supabase_rest.enabled:
            try:
                auth = supabase_rest.auth_signup(email, password, {"full_name": display_name, "phone": phone, "customer_id": customer_id})
                auth_user_id = auth.get("user", {}).get("id") if isinstance(auth, dict) else None
            except SupabaseError:
                if identity_settings.strict_supabase:
                    raise
        row = {
            "id": str(uuid.uuid4()), "auth_user_id": auth_user_id, "customer_id": customer_id,
            "full_name": display_name, "display_name": display_name, "email": email.lower().strip(),
            "mobile_number": phone, "phone": phone, "account_number": account_number,
            "tenant_id": "TENANT_FUSB_001", "app_id": "com.fusionbank.mobileapp",
            "status": "ACTIVE", "created_at": _now(), "updated_at": _now(),
        }
        customer = self._write("customers", row)
        self._write("behaviour_profiles", {"id": str(uuid.uuid4()), "customer_id": customer["id"], "preferred_countries": [], "preferred_cities": [], "preferred_networks": [], "login_count": 0, "transaction_count": 0, "baseline": {}, "created_at": _now(), "updated_at": _now()})
        if device:
            device_row = {"id": str(uuid.uuid4()), "customer_id": customer["id"], "device_uuid": device["device_uuid"], "device_fingerprint": device.get("fingerprint", ""), "model": device.get("model", "unknown"), "manufacturer": device.get("manufacturer", "unknown"), "android_version": device.get("android_version", "unknown"), "sdk_version": device.get("sdk_version", "unknown"), "app_version": device.get("app_version", "unknown"), "known_device": True, "trust_score": 80, "created_at": _now(), "updated_at": _now()}
            self._write("registered_devices", device_row)
        return {"customer": customer, "supabase_auth_user_id": auth_user_id, "email_verification_required": bool(supabase_rest.enabled)}

    def evaluate_login(self, *, customer: dict[str, Any], device_id: str, request: Request, device: dict[str, Any] | None = None) -> dict[str, Any]:
        customer = self._resolve_customer(customer)
        now = _now(); ip = _client_ip(request); geo = lookup_ip(ip) if ip else {}
        country = request.headers.get("x-country") or geo.get("country") or "Unknown"
        city = request.headers.get("x-city") or geo.get("city") or "Unknown"
        isp = request.headers.get("x-isp") or "Unknown"
        network = request.headers.get("x-network") or request.headers.get("x-network-type") or "Unknown"
        attested_vpn = request.headers.get("x-fusion-vpn-detected", "false").lower() == "true"
        vpn = attested_vpn or request.headers.get("x-proxy-detected", "false").lower() == "true"
        existing_devices = list_all("registered_devices")
        known = any(item.get("device_uuid") == device_id or item.get("device_id") == device_id for item in existing_devices if item.get("customer_id") in (None, customer.get("id"), customer.get("customer_id")))
        prior_logins = [item for item in list_all("login_history") if item.get("customer_id") in (customer.get("id"), customer.get("customer_id"))]
        prior_locations = [item for item in list_all("location_history") if item.get("customer_id") in (customer.get("id"), customer.get("customer_id"))]
        reasons: list[str] = []
        score = 8.0
        if not known: score += 25; reasons.append("UNKNOWN_DEVICE")
        if vpn: score += 30; reasons.append("VPN_OR_PROXY_DETECTED")
        if prior_locations and city not in {item.get("city") for item in prior_locations}: score += 20; reasons.append("UNKNOWN_LOCATION")
        if len([item for item in prior_logins if item.get("success", True)]) > 0 and not known: score += 10; reasons.append("MULTIPLE_DEVICE_LOGIN")
        root = bool((device or {}).get("root_detected", False)); emulator = bool((device or {}).get("emulator_detected", False))
        if root: score += 20; reasons.append("ROOT_DETECTED")
        if emulator: score += 15; reasons.append("EMULATOR_DETECTED")
        score = min(100.0, score)
        status = "SUSPICIOUS" if score >= 35 else "ACTIVE"
        session_id = str(uuid.uuid4())
        customer_ref = customer.get("id") or customer.get("customer_id")
        device_ref = self._resolve_device(customer_id=customer.get("id"), device_id=device_id, device=device or {}, known=known)
        session = {"id": str(uuid.uuid4()), "session_uuid": session_id, "customer_id": customer_ref, "device_id": device_ref, "status": status, "risk_score": score, "threat_count": len(reasons), "ip_address": ip or None, "country": country, "city": city, "isp": isp, "network": network, "vpn_detected": vpn, "started_at": now, "last_seen_at": now, "created_at": now, "updated_at": now}
        self._write("active_sessions", session)
        login = {"id": str(uuid.uuid4()), "customer_id": session["customer_id"], "session_id": session["id"], "device_id": device_ref, "login_at": now, "success": True, "ip_address": ip or None, "country": country, "city": city, "isp": isp, "network": network, "vpn_detected": vpn, "root_detected": root, "emulator_detected": emulator, "risk_score": score, "reasons": reasons, "created_at": now, "updated_at": now}
        self._write("login_history", login)
        self._write("location_history", {"id": str(uuid.uuid4()), "customer_id": session["customer_id"], "session_id": session["id"], "ip_address": ip or None, "country": country, "city": city, "network": network, "isp": isp, "latitude": geo.get("lat"), "longitude": geo.get("lon"), "observed_at": now, "created_at": now, "updated_at": now})
        self._write("risk_scores", {"id": str(uuid.uuid4()), "customer_id": session["customer_id"], "session_id": session["id"], "score": score, "device_score": 20 if not known else 85, "network_score": 20 if vpn else 90, "behaviour_score": 60, "threat_score": min(100, len(reasons) * 20), "transaction_score": 0, "explanation": {"reasons": reasons}, "calculated_at": now, "created_at": now, "updated_at": now})
        self._write("vpn_detection", {"id": str(uuid.uuid4()), "customer_id": session["customer_id"], "session_id": session["id"], "ip_address": ip or None, "provider": isp, "is_vpn": vpn, "is_proxy": request.headers.get("x-proxy-detected", "false").lower() == "true", "is_tor": request.headers.get("x-tor-detected", "false").lower() == "true", "confidence": 95 if vpn else 5, "evidence": {"source": "android_attestation_or_trusted_proxy_headers"}, "detected_at": now, "created_at": now, "updated_at": now})
        event = None
        notification = None
        email_log = None
        if reasons:
            event = self._write("security_events", {"id": str(uuid.uuid4()), "customer_id": session["customer_id"], "session_id": session["id"], "device_id": device_ref, "event_type": "SUSPICIOUS_LOGIN", "severity": "CRITICAL" if score >= 70 else "WARNING", "confidence": min(99, 60 + len(reasons) * 8), "evidence": {"reasons": reasons, "ip": ip, "country": country, "city": city, "network": network, "vpn_detected": vpn}, "recommendation": "Verify this login and revoke unknown sessions if it was not you.", "detected_at": now, "created_at": now, "updated_at": now})
            notification = notification_service.create(user_id=customer.get("user_id") or customer.get("customer_id") or session["customer_id"], kind="SUSPICIOUS_LOGIN", message="Suspicious login detected. A security notification has been sent to your registered email.", session_id=session_id, device_id=device_id, severity="CRITICAL" if score >= 70 else "WARNING", metadata={"risk_score": score, "reasons": reasons})
            self._write("customer_notifications", {"id": str(uuid.uuid4()), "customer_id": session["customer_id"], "session_id": session["id"], "notification_type": "SUSPICIOUS_LOGIN", "channel": "EMAIL", "severity": "CRITICAL" if score >= 70 else "WARNING", "title": "Suspicious login detected", "message": notification["message"], "risk_score": score, "status": "QUEUED", "created_at": now, "updated_at": now})
            email_log = security_email_service.send(customer=customer, event_type="SUSPICIOUS_LOGIN", reason=", ".join(reasons), risk_score=score, device=device_id, location=f"{city}, {country}", session_id=session_id)
        event_payload = {"msg_type": "identity_security", "event_type": "LOGIN_EVALUATED", "session_id": session_id, "user_id": customer.get("user_id") or customer.get("customer_id"), "device_id": device_id, "risk_score": score, "threats": reasons, "vpn_detected": vpn, "country": country, "city": city, "notification_status": email_log.get("status") if email_log else "NOT_REQUIRED"}
        try:
            import asyncio
            asyncio.create_task(platform_event_broker.publish(event_payload))
        except RuntimeError:
            pass
        return {"session_id": session_id, "status": status, "risk_score": score, "threats": reasons, "vpn_detected": vpn, "country": country, "city": city, "notification": notification, "email": email_log, "security_event": event}

    def bind_sdk_session(self, *, security_session_id: str | None, sdk_session_id: str, user_id: str, device_id: str) -> None:
        if not security_session_id:
            rows = [row for row in list_all("active_sessions") if row.get("customer_id") in {user_id} and row.get("device_id") in {device_id}]
            security_session_id = rows[-1].get("session_uuid") if rows else None
        if security_session_id:
            row = get("active_sessions", security_session_id) or {}
            row.update({"sdk_session_id": sdk_session_id, "last_seen_at": _now(), "updated_at": _now()})
            put("active_sessions", security_session_id, row)

    def record_activity(self, *, sdk_session_id: str, event_type: str, user_id: str, device_id: str, risk_delta: float = 0, metadata: dict[str, Any] | None = None) -> dict[str, Any] | None:
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
        
        return row


identity_trust = IdentityTrustService()
