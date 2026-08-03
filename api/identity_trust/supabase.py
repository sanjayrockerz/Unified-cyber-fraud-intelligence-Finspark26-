from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from .config import identity_settings


class SupabaseError(RuntimeError):
    pass


class SupabaseRest:
    """Small dependency-free Supabase REST/Auth adapter for the API service role."""

    def __init__(self) -> None:
        self.settings = identity_settings

    @property
    def enabled(self) -> bool:
        return self.settings.supabase_enabled

    def _request(self, path: str, *, method: str = "GET", body: dict[str, Any] | None = None, auth_key: str | None = None) -> Any:
        if not self.enabled:
            raise SupabaseError("Supabase is not configured")
        key = auth_key or self.settings.supabase_service_role_key
        headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        request = urllib.request.Request(
            f"{self.settings.supabase_url}{path}",
            data=json.dumps(body).encode("utf-8") if body is not None else None,
            headers=headers,
            method=method,
        )
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                raw = response.read().decode("utf-8")
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise SupabaseError(f"Supabase {exc.code}: {detail[:500]}") from exc
        except urllib.error.URLError as exc:
            raise SupabaseError(f"Supabase connection failed: {exc.reason}") from exc

    def insert(self, table: str, row: dict[str, Any]) -> dict[str, Any]:
        result = self._request(f"/rest/v1/{table}", method="POST", body=row)
        return (result[0] if isinstance(result, list) and result else result) or row

    def upsert(self, table: str, row: dict[str, Any], on_conflict: str) -> dict[str, Any]:
        encoded = urllib.parse.quote(on_conflict, safe="")
        result = self._request(f"/rest/v1/{table}?on_conflict={encoded}", method="POST", body=row)
        return (result[0] if isinstance(result, list) and result else result) or row

    def select(self, table: str, *, filters: dict[str, str], limit: int = 100) -> list[dict[str, Any]]:
        query = urllib.parse.urlencode({**filters, "limit": str(limit)})
        result = self._request(f"/rest/v1/{table}?{query}")
        return result if isinstance(result, list) else []

    def auth_signup(self, email: str, password: str, metadata: dict[str, Any]) -> dict[str, Any]:
        key = self.settings.supabase_anon_key or self.settings.supabase_service_role_key
        return self._request("/auth/v1/signup", method="POST", body={"email": email, "password": password, "data": metadata}, auth_key=key)

    def auth_password_reset(self, email: str) -> Any:
        key = self.settings.supabase_anon_key or self.settings.supabase_service_role_key
        return self._request("/auth/v1/recover", method="POST", body={"email": email}, auth_key=key)

    def auth_password_signin(self, email: str, password: str) -> dict[str, Any]:
        key = self.settings.supabase_anon_key or self.settings.supabase_service_role_key
        return self._request(
            "/auth/v1/token?grant_type=password",
            method="POST",
            body={"email": email, "password": password},
            auth_key=key,
        )


supabase_rest = SupabaseRest()
