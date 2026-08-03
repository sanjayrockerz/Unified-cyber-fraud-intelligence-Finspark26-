from __future__ import annotations

import html
import json
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone
from typing import Any

from api.store import put

from .config import identity_settings
from .supabase import SupabaseError, supabase_rest


def _escape(value: Any) -> str:
    return html.escape(str(value if value not in (None, "") else "Unknown"))


class SecurityEmailService:
    def send(self, *, customer: dict[str, Any], event_type: str, reason: str, risk_score: float, device: str, location: str, session_id: str | None) -> dict[str, Any]:
        email = str(customer.get("email", "")).strip()
        subject = f"Fusion Security Alert: {event_type.replace('_', ' ').title()}"
        body = f"""
        <div style=\"font-family:Arial,sans-serif;max-width:640px;margin:auto\">
          <h2>Fusion National Bank security alert</h2>
          <p>Hello {_escape(customer.get('display_name') or customer.get('full_name') or customer.get('username'))},</p>
          <p>We detected activity that requires your attention.</p>
          <table><tr><td><b>Reason</b></td><td>{_escape(reason)}</td></tr>
          <tr><td><b>Risk score</b></td><td>{risk_score:.0f}/100</td></tr>
          <tr><td><b>Device</b></td><td>{_escape(device)}</td></tr>
          <tr><td><b>Location</b></td><td>{_escape(location)}</td></tr>
          <tr><td><b>Time</b></td><td>{_escape(datetime.now(timezone.utc).isoformat())}</td></tr></table>
          <p>If this was not you, change your password and contact support immediately.</p>
        </div>
        """
        log = {
            "id": str(uuid.uuid4()), "customer_id": customer.get("customer_uuid"), "session_id": session_id,
            "recipient_email": email, "template_key": event_type, "subject": subject,
            "provider": identity_settings.email_provider, "status": "SKIPPED" if not email else "FAILED",
            "error_message": None, "created_at": datetime.now(timezone.utc).isoformat(),
        }
        if not email:
            log["error_message"] = "Customer has no verified email address"
        elif identity_settings.email_provider == "resend" and identity_settings.resend_api_key:
            request = urllib.request.Request(
                "https://api.resend.com/emails", method="POST",
                data=json.dumps({"from": identity_settings.email_from, "to": [email], "subject": subject, "html": body}).encode("utf-8"),
                headers={"Authorization": f"Bearer {identity_settings.resend_api_key}", "Content-Type": "application/json"},
            )
            try:
                with urllib.request.urlopen(request, timeout=15) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                log.update(status="SENT", provider_message_id=payload.get("id"), sent_at=datetime.now(timezone.utc).isoformat())
            except (urllib.error.HTTPError, urllib.error.URLError, ValueError) as exc:
                log["error_message"] = str(exc)
        else:
            log["error_message"] = "Configure RESEND_API_KEY and SECURITY_EMAIL_FROM"
        put("email_logs", log["id"], log)
        if supabase_rest.enabled:
            try:
                supabase_rest.insert("email_logs", {k: v for k, v in log.items() if k != "id"})
            except SupabaseError:
                pass
        return log


security_email_service = SecurityEmailService()
