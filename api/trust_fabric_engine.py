"""
TrustFabricEngine — thin facade over LedgerService.

Previously this was a non-functional stub that returned hardcoded/fake data.
It is now wired to LedgerService so that evidence creation, verification,
history, and bundle export all use the real cryptographic ledger.
"""
from __future__ import annotations

from typing import Any


class TrustFabric:
    """Facade that delegates all evidence operations to LedgerService."""

    def __init__(self) -> None:
        # Lazy import avoids a circular dependency at module load time.
        from api.ledger_service import ledger_service
        self._ledger = ledger_service

    def create_evidence_package(self, data: dict[str, Any]) -> dict[str, Any]:
        """Lock an evidence package into the immutable ledger chain."""
        return self._ledger.create_evidence_record(data)

    def get_evidence(self, evidence_id: str) -> dict[str, Any]:
        """Return a stored ledger record by evidence ID."""
        record = self._ledger.ledger_store.get(evidence_id)
        if record is None:
            return {"evidence_id": evidence_id, "data": {}, "found": False}
        return record

    def verify_evidence_integrity(self, evidence_id: str) -> dict[str, Any]:
        """Cryptographically verify evidence against the hash chain."""
        return self._ledger.verify_evidence(evidence_id)

    def get_audit_trail(self, incident_id: str) -> dict[str, Any]:
        """Return the full chain-of-custody log for an evidence record."""
        trail = self._ledger.get_evidence_history(incident_id)
        return {"incident_id": incident_id, "trail": trail}

    def export_evidence_bundle(self, evidence_id: str, fmt: str = "json") -> dict[str, Any]:
        """Return the evidence record in the requested format.

        The ledger stores the full evidence record including the raw package,
        hash, digital signature, and chain of custody.  A URL-based download
        is not implemented in this deployment; the bundle is returned inline.
        """
        record = self._ledger.ledger_store.get(evidence_id)
        if record is None:
            return {
                "evidence_id": evidence_id,
                "format": fmt,
                "status": "NOT_FOUND",
                "bundle": None,
            }
        return {
            "evidence_id": evidence_id,
            "format": fmt,
            "status": "AVAILABLE",
            "bundle": record,
        }


trust_fabric = TrustFabric()
