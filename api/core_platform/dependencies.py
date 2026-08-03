from __future__ import annotations

from fastapi import HTTPException, Request

from api import store


def get_current_tenant(request: Request) -> str:
    tenant = getattr(request.state, "tenant", None)
    if not tenant:
        raise HTTPException(status_code=401, detail="Authenticated tenant is required")
    return str(tenant)


def check_resource_ownership(resource_type: str, resource_id: str, tenant_id: str) -> None:
    """Reject access unless the resource's persisted tenant matches the caller."""
    if not store.check_resource_ownership(resource_type, resource_id, tenant_id):
        raise HTTPException(status_code=403, detail="Access to this resource is forbidden")
