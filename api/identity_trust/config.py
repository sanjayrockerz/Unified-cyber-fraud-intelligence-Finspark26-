from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class IdentitySettings:
    supabase_url: str = os.getenv("SUPABASE_URL", "").rstrip("/")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    resend_api_key: str = os.getenv("RESEND_API_KEY", "")
    email_from: str = os.getenv("SECURITY_EMAIL_FROM", "Fusion Security <security@example.invalid>")
    email_provider: str = os.getenv("SECURITY_EMAIL_PROVIDER", "resend").lower()
    ipqualityscore_api_key: str = os.getenv("IPQUALITYSCORE_API_KEY", "")
    strict_supabase: bool = os.getenv("IDENTITY_SUPABASE_REQUIRED", "false").lower() == "true"

    @property
    def supabase_enabled(self) -> bool:
        return bool(self.supabase_url and (self.supabase_service_role_key or self.supabase_anon_key))


identity_settings = IdentitySettings()
