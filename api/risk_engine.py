import json
import os
import sys
from pathlib import Path

# Add project root to sys.path so ml.predict can be imported
ROOT = Path(__file__).parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml.predict import tabular_score, anomaly_score

# Load entity graph features
try:
    with open(ROOT / 'data' / 'processed' / 'entity_graph_features.json', 'r') as f:
        GRAPH_FEATURES = json.load(f)
except FileNotFoundError:
    GRAPH_FEATURES = {}


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
