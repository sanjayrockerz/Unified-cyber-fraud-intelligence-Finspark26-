#!/usr/bin/env python3
"""
Seed the demo session SESS_9921_CRITICAL with realistic degraded trust data
to support the UI narrative in Operations Center and Investigation Workbench.

This script creates a session passport with degraded component values that trigger
a BLOCK verdict, matching the "CRITICAL IN REVIEW" and "Verdict: BLOCK" narrative
already present in other parts of the demo UI.
"""

import sys
import os
import uuid
from datetime import datetime, timezone

# Add api to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "api"))

from session_intelligence.models import (
    SessionContext,
    SessionLifecycle,
    TrustPassport,
    TrustComponent,
    ComponentName,
    TrustTrend,
    TrustSnapshot,
)
from session_intelligence.repository import SessionTrustRepository


def seed_demo_session():
    """
    Seed SESS_9921_CRITICAL with a realistic degraded trust passport.

    This session represents a user with:
    - Suspicious device behavior (device_trust: 35)
    - Active threat indicators (threat_trust: 25)
    - Poor graph reputation (graph_trust: 20)
    - Overall trust score: 32 (below the 30 threshold, triggers BLOCK)
    """

    repo = SessionTrustRepository()
    demo_session_id = "SESS_9921_CRITICAL"
    demo_user_id = "usr_9921"

    now = datetime.now(timezone.utc)

    # Create session context (background session info)
    context = SessionContext(
        session_id=demo_session_id,
        user_id=demo_user_id,
        device_id="dev_9921_suspicious",
        location="185.15.2.22",  # Known risky IP
        created_at=now,
        last_activity=now,
        lifecycle=SessionLifecycle.BLOCKED,  # This session is blocked
        threat_count=3,
        event_count=7,
    )

    # Create trust components with degraded values
    components = {
        ComponentName.IDENTITY: TrustComponent(
            name=ComponentName.IDENTITY,
            value=68.0,  # Moderate identity risk
            confidence=0.85,
            previous_value=80.0,
            difference=-12.0,
            trend=TrustTrend.DECLINING,
            reasons=["Account age moderate", "Recent credential reset", "Prior fraud history flagged"],
            updated_at=now,
        ),
        ComponentName.DEVICE: TrustComponent(
            name=ComponentName.DEVICE,
            value=35.0,  # Significant device risk
            confidence=0.9,
            previous_value=85.0,
            difference=-50.0,
            trend=TrustTrend.DECLINING,
            reasons=["Unrecognized device", "Device emulation detected", "Root access indicators"],
            updated_at=now,
        ),
        ComponentName.RUNTIME: TrustComponent(
            name=ComponentName.RUNTIME,
            value=42.0,  # Runtime compromise suspected
            confidence=0.88,
            previous_value=90.0,
            difference=-48.0,
            trend=TrustTrend.DECLINING,
            reasons=["Screen recording active", "Frida instrumentation detected", "Debugger attached"],
            updated_at=now,
        ),
        ComponentName.BEHAVIOUR: TrustComponent(
            name=ComponentName.BEHAVIOUR,
            value=55.0,  # Behavioral anomalies
            confidence=0.82,
            previous_value=75.0,
            difference=-20.0,
            trend=TrustTrend.DECLINING,
            reasons=["Unusual transaction amount", "Atypical transfer pattern", "Beneficiary mismatch"],
            updated_at=now,
        ),
        ComponentName.NETWORK: TrustComponent(
            name=ComponentName.NETWORK,
            value=48.0,  # Network risk present
            confidence=0.85,
            previous_value=80.0,
            difference=-32.0,
            trend=TrustTrend.DECLINING,
            reasons=["VPN tunnel active", "Impossible travel detected", "Public WiFi usage"],
            updated_at=now,
        ),
        ComponentName.GEO: TrustComponent(
            name=ComponentName.GEO,
            value=52.0,  # Geographic anomaly
            confidence=0.80,
            previous_value=85.0,
            difference=-33.0,
            trend=TrustTrend.DECLINING,
            reasons=["GPS spoofing suspected", "Geofence violation", "Inconsistent location history"],
            updated_at=now,
        ),
        ComponentName.THREAT: TrustComponent(
            name=ComponentName.THREAT,
            value=25.0,  # Critical threat indicators
            confidence=0.95,
            previous_value=85.0,
            difference=-60.0,
            trend=TrustTrend.DECLINING,
            reasons=[
                "Banking trojan signatures detected",
                "C2 communication patterns observed",
                "Known mule account cluster detected",
            ],
            updated_at=now,
        ),
        ComponentName.GRAPH: TrustComponent(
            name=ComponentName.GRAPH,
            value=20.0,  # Severe graph risk
            confidence=0.93,
            previous_value=85.0,
            difference=-65.0,
            trend=TrustTrend.DECLINING,
            reasons=[
                "Connected to mule ring (distance: 1)",
                "High-risk money mule cluster",
                "Account dormancy abuse pattern",
            ],
            updated_at=now,
        ),
        ComponentName.TRANSACTION: TrustComponent(
            name=ComponentName.TRANSACTION,
            value=38.0,  # Transaction risk
            confidence=0.87,
            previous_value=82.0,
            difference=-44.0,
            trend=TrustTrend.DECLINING,
            reasons=["High transaction amount", "First-time beneficiary", "Weekend anomaly"],
            updated_at=now,
        ),
    }

    # Calculate weighted overall_trust matching the policy weights
    weights = {
        ComponentName.IDENTITY: 0.14,
        ComponentName.DEVICE: 0.13,
        ComponentName.RUNTIME: 0.13,
        ComponentName.BEHAVIOUR: 0.10,
        ComponentName.NETWORK: 0.10,
        ComponentName.GEO: 0.08,
        ComponentName.THREAT: 0.14,
        ComponentName.GRAPH: 0.08,
        ComponentName.TRANSACTION: 0.10,
    }

    overall_trust = sum(
        components[comp_name].value * weight
        for comp_name, weight in weights.items()
        if comp_name in components
    )
    overall_trust = round(overall_trust, 1)

    print(f"Calculated overall_trust: {overall_trust}")

    # Create trust passport
    passport = TrustPassport(
        passport_id=f"{demo_session_id}_20260726",
        session_id=demo_session_id,
        user_id=demo_user_id,
        identity_trust=components[ComponentName.IDENTITY].value,
        device_trust=components[ComponentName.DEVICE].value,
        runtime_trust=components[ComponentName.RUNTIME].value,
        behaviour_trust=components[ComponentName.BEHAVIOUR].value,
        network_trust=components[ComponentName.NETWORK].value,
        geo_trust=components[ComponentName.GEO].value,
        threat_trust=components[ComponentName.THREAT].value,
        graph_trust=components[ComponentName.GRAPH].value,
        transaction_trust=components[ComponentName.TRANSACTION].value,
        overall_trust=overall_trust,
        confidence=0.88,
        current_status=SessionLifecycle.BLOCKED,
        created_time=now,
        updated_time=now,
        version="trust-v1.0.0",
        trust_trend=TrustTrend.DECLINING,
        components=components,
    )

    # Create a trust snapshot for history (use unique ID to allow re-seeding)
    snapshot = TrustSnapshot(
        snapshot_id=f"snap_{uuid.uuid4().hex[:8]}",
        session_id=demo_session_id,
        timestamp=now,
        event_type="DEMO_INITIALIZATION",
        previous_trust=100.0,
        current_trust=overall_trust,
        delta=overall_trust - 100.0,
        reason="Demo session initialized with realistic degraded trust profile for UI narrative",
        passport=passport,
    )

    # Save the session state
    repo.save_state(context, passport, snapshot, [])

    print(f"[SUCCESS] Seeded demo session: {demo_session_id}")
    print(f"  Overall Trust: {overall_trust}% (BLOCKED)")
    print(f"  Status: {passport.current_status}")
    print(f"  Key Risks:")
    print(f"    - Threat Intelligence: {components[ComponentName.THREAT].value}% (CRITICAL)")
    print(f"    - Graph Analysis: {components[ComponentName.GRAPH].value}% (CRITICAL)")
    print(f"    - Device Analysis: {components[ComponentName.DEVICE].value}% (HIGH)")


if __name__ == "__main__":
    seed_demo_session()
