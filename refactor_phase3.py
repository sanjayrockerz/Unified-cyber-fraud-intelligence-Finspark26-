import os
import re

CYBER_THREAT_PATH = r"C:\Users\motis\Downloads\fastapi\Unified-Cyber-Fraud-Intelligence-Platform\api\cyber_threat_engine.py"
RISK_ENGINE_PATH = r"C:\Users\motis\Downloads\fastapi\Unified-Cyber-Fraud-Intelligence-Platform\api\risk_engine.py"

def patch_risk_engine():
    with open(RISK_ENGINE_PATH, "r") as f:
        content = f.read()

    new_evaluate_logic = '''
def evaluate(transaction: dict, include_cyber_context: bool = True) -> dict:
    """
    Evaluates a transaction and returns a risk score (0-100), an action, and a list of reasons.
    Phase 3: Dynamic, weighted risk scoring instead of hardcoded base ML values.
    """
    score = 50.0  # Base anchor score
    reasons = []

    device_status = transaction.get("device_status", "unknown")
    if device_status == "known":
        score -= 20
        reasons.append("Known Device (-20)")
    elif device_status == "unknown" or transaction.get("event_type") == "NEW_DEVICE_DETECTED":
        score += 25
        reasons.append("Unknown Device (+25)")

    if transaction.get("trusted_behaviour"):
        score -= 15
        reasons.append("Trusted Behaviour (-15)")

    if transaction.get("vpn_detected") or transaction.get("event_type") in ["VPN_ENABLED", "PROXY_DETECTED"]:
        score += 20
        reasons.append("VPN Detected (+20)")

    if transaction.get("new_beneficiary"):
        score += 20
        reasons.append("New Beneficiary (+20)")

    amount = float(transaction.get("amount", 0.0))
    if amount > 50000:
        score += 15
        reasons.append("Large Transfer (+15)")

    if include_cyber_context and transaction.get("cyber_compromise_in_window"):
        score += 15
        reasons.append("Cyber compromise in window (+15)")
        
    try:
        from ml.predict import anomaly_score
        anom_score = anomaly_score(transaction)
        if anom_score < -0.1:
            score += 20
            reasons.append(f"Unusual transaction pattern detected (+20)")
    except ImportError:
        pass

    score = min(100.0, max(0.0, score))
    
    if score >= 75:
        action = "BLOCK"
    elif score >= 50:
        action = "CHALLENGE"
    else:
        action = "ALLOW"
        if not reasons:
            reasons.append("Transaction falls within normal parameters")
            
    return {
        "score": score,
        "action": action,
        "reasons": reasons,
        "counterfactual": None
    }
'''
    # Extract everything before def evaluate(
    header = content.split("def evaluate(transaction: dict, include_cyber_context: bool = True) -> dict:")[0]
    with open(RISK_ENGINE_PATH, "w") as f:
        f.write(header + new_evaluate_logic)
    print("Patched risk_engine.py successfully.")

def patch_threat_engine():
    with open(CYBER_THREAT_PATH, "r") as f:
        content = f.read()

    new_dispatch_logic = '''
    def evaluate_event(self, event_data: dict) -> list[dict]:
        """
        Main entry point: Ingests raw SDK event payload and evaluates Phase 3 Decoupled Threat rules.
        """
        t0 = time.perf_counter()
        session_id = event_data.get("session_id", "SDK_SESS_DEMO")
        device_id = event_data.get("device_id", "DEV_12345")
        user_id = event_data.get("user_id", "usr_sdk_demo")
        event_type = event_data.get("event_type", "UNKNOWN")
        amount = float(event_data.get("amount", 0.0))
        
        detected_threats = []
        raw_threats = []

        # 1. Unknown Device
        if event_data.get("device_status") == "unknown" or event_type == "NEW_DEVICE_DETECTED":
            raw_threats.append({
                "threat_name": "Unknown Device", "threat_category": "Device Threats",
                "severity": "MEDIUM", "confidence": 85.0,
                "evidence": ["Device fingerprint not recognized"],
                "detection_source": "Phase 3 Threat Engine", "trust_impact": {"device_trust": -25.0},
                "recommended_action": "REQUIRE_OTP"
            })
            
        # 2. VPN
        if event_data.get("vpn_detected") or event_type in ["VPN_ENABLED", "PROXY_DETECTED", "TOR_NODE_DETECTED"]:
            raw_threats.append({
                "threat_name": "VPN or Proxy Active", "threat_category": "Network Threats",
                "severity": "HIGH", "confidence": 90.0,
                "evidence": ["Anonymizing network active"],
                "detection_source": "Phase 3 Threat Engine", "trust_impact": {"network_trust": -20.0},
                "recommended_action": "REQUIRE_OTP"
            })
            
        # 3. Impossible Travel
        if event_type == "IMPOSSIBLE_TRAVEL":
            raw_threats.append({
                "threat_name": "Impossible Travel", "threat_category": "Identity Threats",
                "severity": "CRITICAL", "confidence": 95.0,
                "evidence": ["Unrealistic geographic movement"],
                "detection_source": "Phase 3 Threat Engine", "trust_impact": {"identity_trust": -40.0},
                "recommended_action": "BLOCK_TRANSACTION"
            })

        # 4. Behaviour Anomaly
        if event_type in ["ROBOTIC_BEHAVIOUR", "BEHAVIOUR_ANOMALY"]:
            raw_threats.append({
                "threat_name": "Behaviour Anomaly", "threat_category": "Behaviour Threats",
                "severity": "HIGH", "confidence": 80.0,
                "evidence": ["Non-human telemetry patterns"],
                "detection_source": "Phase 3 Threat Engine", "trust_impact": {"behaviour_trust": -30.0},
                "recommended_action": "REQUIRE_BIOMETRIC"
            })

        # 5. Large Transaction
        if amount > 50000:
            raw_threats.append({
                "threat_name": "Large Transaction Surge", "threat_category": "Transaction Threats",
                "severity": "HIGH", "confidence": 100.0,
                "evidence": [f"Amount {amount} exceeds normal velocity"],
                "detection_source": "Phase 3 Threat Engine", "trust_impact": {"session_trust": -15.0},
                "recommended_action": "REQUIRE_BIOMETRIC"
            })

        # 6. Multiple Sessions
        if event_type == "CONCURRENT_LOGIN":
            raw_threats.append({
                "threat_name": "Multiple Sessions", "threat_category": "Session Threats",
                "severity": "HIGH", "confidence": 92.0,
                "evidence": ["Multiple active IPs on account"],
                "detection_source": "Phase 3 Threat Engine", "trust_impact": {"session_trust": -30.0},
                "recommended_action": "TERMINATE_SESSION"
            })

        # 7. Credential Abuse
        if event_type == "CREDENTIAL_STUFFING":
            raw_threats.append({
                "threat_name": "Credential Abuse", "threat_category": "Identity Threats",
                "severity": "CRITICAL", "confidence": 88.0,
                "evidence": ["High volume failed logins detected"],
                "detection_source": "Phase 3 Threat Engine", "trust_impact": {"identity_trust": -50.0},
                "recommended_action": "BLOCK_TRANSACTION"
            })

        # 8. Session Hijack
        if event_type == "SESSION_HIJACK_ATTEMPT":
            raw_threats.append({
                "threat_name": "Session Hijack", "threat_category": "Session Threats",
                "severity": "CRITICAL", "confidence": 96.0,
                "evidence": ["TLS Session ID cloned / stolen cookie"],
                "detection_source": "Phase 3 Threat Engine", "trust_impact": {"session_trust": -50.0},
                "recommended_action": "TERMINATE_SESSION"
            })

        for item in raw_threats:
            threat_obj = self._build_threat_object(
                item, session_id, device_id, user_id, t0, event_data
            )
            # Patch in independent confidence
            threat_obj["confidence"] = item.get("confidence", 80.0)
            self._save_threat(threat_obj)
            detected_threats.append(threat_obj)

        correlated_campaigns = self._correlate_campaigns(session_id, device_id, t0)
        for campaign in correlated_campaigns:
            self._save_threat(campaign)
            detected_threats.append(campaign)

        return detected_threats
'''
    
    # We will replace the original evaluate_event function block
    # Match from def evaluate_event to right before # CATEGORY 1: Device Threats
    pattern = r'    def evaluate_event\(self, event_data: dict\) -> list\[dict\]:.*?(?=    # CATEGORY 1: Device Threats)'
    new_content = re.sub(pattern, new_dispatch_logic, content, flags=re.DOTALL)
    
    with open(CYBER_THREAT_PATH, "w") as f:
        f.write(new_content)
    print("Patched cyber_threat_engine.py successfully.")

if __name__ == "__main__":
    patch_risk_engine()
    patch_threat_engine()
