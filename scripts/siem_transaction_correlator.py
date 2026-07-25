#!/usr/bin/env python3
"""
Fuzen AI — SIEM & Banking Transaction Telemetry Real-Time Correlator
Author: Principal Banking Cybersecurity Architect
Description: High-throughput, ultra-low latency (<30ms) stream correlator combining
             SIEM/Apache web server logs with transactional banking behavior.
             Uses an Isolation Forest ML model and dynamic sliding-window memory buffers (collections.deque).
"""

import sys
import time
import json
import logging
from collections import deque
from typing import Dict, Any, Tuple, Optional
import numpy as np
from sklearn.ensemble import IsolationForest

# Configure structured logging for CISO Dashboard ingestion
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("SIEM_Txn_Correlator")


class TelemetryCorrelatorEngine:
    """
    Production-grade ultra-low latency stream correlator.
    Combines SIEM logs and banking transaction events using sliding window memory buffers.
    """
    def __init__(self, window_size: int = 100, contamination: float = 0.05):
        # Sliding window memory buffers (using collections.deque for O(1) performance)
        self.siem_buffer: Dict[str, deque] = {}  # key: user_id -> deque of SIEM events
        self.txn_buffer: Dict[str, deque] = {}   # key: user_id -> deque of Txn events
        self.window_size = window_size

        # Machine Learning Model: Isolation Forest for Anomaly Detection
        # Feature Vector: [time_delta_sec, ip_reputation_score, transaction_amount, geodistance_velocity_kmh]
        self.model = IsolationForest(
            n_estimators=50,
            contamination=contamination,
            random_state=42,
            n_jobs=-1
        )
        self._fit_baseline_model()

    def _fit_baseline_model(self):
        """Fit Isolation Forest on baseline synthetic normal and malicious feature vectors."""
        # Feature columns: [time_delta, ip_reputation_score, transaction_amount, geodistance_velocity]
        # Normal behavior baseline
        normal_samples = np.random.uniform(
            low=[0.5, 0.80, 50.0, 5.0],
            high=[300.0, 1.00, 5000.0, 80.0],
            size=(500, 4)
        )
        # Anomalous behavior (session hijacking / credential stuffing / impossible travel)
        anomalous_samples = np.random.uniform(
            low=[0.01, 0.05, 50000.0, 800.0],
            high=[2.0, 0.40, 500000.0, 3500.0],
            size=(50, 4)
        )
        X_baseline = np.vstack([normal_samples, anomalous_samples])
        self.model.fit(X_baseline)
        logger.info("Isolation Forest Model trained and ready for low-latency scoring.")

    def process_event_pair(self, siem_log: Dict[str, Any], txn_log: Dict[str, Any]) -> Tuple[Dict[str, Any], float]:
        """
        Process a paired SIEM + Banking Transaction log pair.
        Execution target: < 30 milliseconds.
        """
        start_time = time.perf_counter()
        
        user_id = txn_log.get("user_id", "UNKNOWN_USER")
        
        # Maintain sliding window memory buffer
        if user_id not in self.siem_buffer:
            self.siem_buffer[user_id] = deque(maxlen=self.window_size)
            self.txn_buffer[user_id] = deque(maxlen=self.window_size)

        self.siem_buffer[user_id].append(siem_log)
        self.txn_buffer[user_id].append(txn_log)

        # Feature Vector Extraction
        time_delta = abs(txn_log.get("timestamp_epoch", time.time()) - siem_log.get("timestamp_epoch", time.time()))
        ip_reputation_score = float(siem_log.get("ip_reputation_score", 0.95))  # 0.0 (malicious) to 1.0 (clean)
        transaction_amount = float(txn_log.get("transaction_amount", 0.0))
        geodistance_velocity = float(txn_log.get("geodistance_velocity_kmh", 0.0))

        feature_vector = np.array([[time_delta, ip_reputation_score, transaction_amount, geodistance_velocity]])

        # Normalize Isolation Forest decision score to range [0.0, 1.0]
        # Lower decision_function values imply higher anomaly severity.
        raw_score = self.model.decision_function(feature_vector)[0]
        # Invert and scale so malicious combinations map above 0.75
        anomaly_score = round(float(np.clip(0.5 - (raw_score * 3.5), 0.0, 1.0)), 4)

        # Adaptive Risk Scoring Engine
        if anomaly_score > 0.75:
            threat_level = "CRITICAL"
            action = "TRIGGER_STEP_UP_MFA"
        elif anomaly_score > 0.50:
            threat_level = "HIGH"
            action = "ENABLE_STEP_UP_CHALLENGE"
        elif anomaly_score > 0.30:
            threat_level = "MEDIUM"
            action = "MONITOR_SESSION"
        else:
            threat_level = "LOW"
            action = "ALLOW"

        end_time = time.perf_counter()
        latency_ms = round((end_time - start_time) * 1000.0, 3)

        ciso_payload = {
            "ciso_alert_id": f"ALT_{int(time.time()*1000)}",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "user_id": user_id,
            "threat_level": threat_level,
            "anomaly_score": anomaly_score,
            "recommended_containment_action": action,
            "telemetry_correlation": {
                "siem_ip": siem_log.get("ip_address"),
                "siem_user_agent": siem_log.get("user_agent"),
                "ip_reputation_score": ip_reputation_score,
                "transaction_amount": transaction_amount,
                "geodistance_velocity_kmh": geodistance_velocity,
                "time_delta_sec": round(time_delta, 3)
            },
            "processing_latency_ms": latency_ms,
            "sla_met": latency_ms < 30.0
        }

        return ciso_payload, latency_ms


# --- PRODUCTION SIMULATION DEMONSTRATION ---
if __name__ == "__main__":
    print("=" * 70)
    print("FUZEN AI — REAL-TIME SIEM & TRANSACTION CORRELATOR")
    print("=" * 70)

    engine = TelemetryCorrelatorEngine()

    # Streaming test payloads: (Normal vs. Session Hijacking / Credential Stuffing)
    test_stream = [
        # Event Pair 1: Normal Mobile Transaction
        (
            {
                "timestamp_epoch": time.time(),
                "ip_address": "185.220.101.5",
                "ip_reputation_score": 0.98,
                "user_agent": "FuzenAIBank/1.0 (Android 14; Pixel 8)"
            },
            {
                "timestamp_epoch": time.time() + 0.1,
                "user_id": "CUST_99412",
                "transaction_amount": 450.00,
                "geodistance_velocity_kmh": 12.5
            }
        ),
        # Event Pair 2: Credential Stuffing / Session Hijacking (High Velocity, Low IP Reputation, Huge Amount)
        (
            {
                "timestamp_epoch": time.time(),
                "ip_address": "45.154.255.88",
                "ip_reputation_score": 0.25,
                "user_agent": "Mozilla/5.0 (Apache-SIEM-Scanner)"
            },
            {
                "timestamp_epoch": time.time() + 0.05,
                "user_id": "CUST_77209",
                "transaction_amount": 75000.00,
                "geodistance_velocity_kmh": 450.0
            }
        ),
        # Event Pair 3: Severe Impossible Travel + Session Hijacking (Critical Threat Trigger)
        (
            {
                "timestamp_epoch": time.time(),
                "ip_address": "185.220.101.4",  # Darknet / Known Tor Exit Node
                "ip_reputation_score": 0.01,
                "user_agent": "Python-urllib/3.10"
            },
            {
                "timestamp_epoch": time.time() + 0.001,
                "user_id": "CUST_CRITICAL_88301",
                "transaction_amount": 950000.00,  # Sudden max transfer
                "geodistance_velocity_kmh": 4200.0  # Impossible travel velocity
            }
        )
    ]

    for i, (siem_event, txn_event) in enumerate(test_stream, start=1):
        print(f"\n[STREAM INGESTION #{i}] Processing log pair for user {txn_event['user_id']}...")
        alert_payload, latency = engine.process_event_pair(siem_event, txn_event)
        
        print(f"Latency: {latency} ms (Target SLA < 30ms: {alert_payload['sla_met']})")
        print("Structured CISO JSON Output:")
        print(json.dumps(alert_payload, indent=2))
