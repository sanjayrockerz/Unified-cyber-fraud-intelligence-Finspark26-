import asyncio
import random
import time
import datetime
from typing import List, Dict, Any
from pathlib import Path
import csv

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
EVAL_CSV = ROOT_DIR / "ml" / "eval_set.csv"
SYNTHETIC_CSV = ROOT_DIR / "data" / "synthetic_transactions.csv"

class DynamicEventStreamEngine:
    def __init__(self):
        self.unified_timeline: List[Dict[str, Any]] = []
        self.max_timeline_size = 500
        self.dataset_records: List[Dict[str, Any]] = []
        self._load_datasets()
        self.is_running = False

    def _load_datasets(self):
        records = []
        if EVAL_CSV.exists():
            try:
                with open(EVAL_CSV, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        records.append(row)
            except Exception:
                pass
        self.dataset_records = records

    def generate_synthetic_event(self) -> Dict[str, Any]:
        event_kinds = [
            "Customer Login", "Normal Transaction", "Large Transaction", 
            "Beneficiary Added", "Password Reset", "VPN Login", 
            "Unknown Device Login", "Multiple Sessions", "Failed Login"
        ]
        chosen_kind = random.choice(event_kinds)
        
        # Draw base row from dataset if available
        base_row = random.choice(self.dataset_records) if self.dataset_records else {}
        
        cust_id = base_row.get("user_id", f"CUST_{random.randint(1000, 9999)}")
        device_uuid = base_row.get("device_id", f"DEV_UUID_{random.randint(100, 999)}")
        
        # Calculate dynamic risk score based on evidence (Phase 2 & Phase 8)
        is_vpn = "VPN" in chosen_kind or random.random() < 0.15
        is_unknown = "Unknown" in chosen_kind or random.random() < 0.12
        is_large = "Large" in chosen_kind or random.random() < 0.10
        
        if is_unknown and is_vpn and is_large:
            risk_score = random.randint(80, 95)
            confidence = round(random.uniform(0.88, 0.97), 2)
            status = "CHALLENGED" if risk_score < 90 else "BLOCKED"
        elif is_vpn or is_unknown or is_large:
            risk_score = random.randint(42, 75)
            confidence = round(random.uniform(0.72, 0.86), 2)
            status = "CHALLENGED" if risk_score > 65 else "APPROVED"
        else:
            risk_score = random.randint(8, 32)
            confidence = round(random.uniform(0.52, 0.70), 2)
            status = "APPROVED"
            
        amount = round(random.uniform(100.0, 150000.0), 2) if "Transaction" in chosen_kind else 0.0
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        event = {
            "id": f"EVT_{int(time.time()*1000)}_{random.randint(100, 999)}",
            "timestamp": now_str,
            "event_type": chosen_kind,
            "customer_id": cust_id,
            "customer_name": f"Customer {cust_id[-4:]}",
            "device_uuid": device_uuid,
            "amount": amount,
            "risk_score": risk_score,
            "confidence": confidence,
            "status": status,
            "vpn_detected": is_vpn,
            "unknown_device": is_unknown,
            "ip_address": f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}",
            "source": "SYNTHETIC_ENGINE"
        }
        return event

    def add_live_apk_event(self, apk_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Merges live APK mobile application events into the unified event timeline (Phases 4 & 5)."""
        now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
        event = {
            "id": f"APK_EVT_{int(time.time()*1000)}_{random.randint(100, 999)}",
            "timestamp": now_str,
            "event_type": apk_payload.get("event_type", "Mobile APK Activity"),
            "customer_id": apk_payload.get("user_id", apk_payload.get("customer_id", "")),
            "customer_name": apk_payload.get("customer_name", ""),
            "device_uuid": apk_payload.get("device_id", apk_payload.get("device_uuid", "")),
            "amount": float(apk_payload.get("amount", 0.0)),
            "risk_score": int(apk_payload.get("risk_score", 0)),
            "confidence": float(apk_payload.get("confidence", 0.0)),
            "status": apk_payload.get("status", "OBSERVED"),
            "vpn_detected": bool(apk_payload.get("vpn_detected", False)),
            "unknown_device": bool(apk_payload.get("unknown_device", False)),
            "ip_address": apk_payload.get("ip_address", ""),
            "source": "LIVE_APK"
        }
        self.unified_timeline.insert(0, event)
        if len(self.unified_timeline) > self.max_timeline_size:
            self.unified_timeline.pop()
        return event

    def record_event(self, event: Dict[str, Any]):
        self.unified_timeline.insert(0, event)
        if len(self.unified_timeline) > self.max_timeline_size:
            self.unified_timeline.pop()

    def get_unified_timeline(self, limit: int = 50, tenant_id: str | None = None) -> List[Dict[str, Any]]:
        events = self.unified_timeline
        if tenant_id:
            events = [event for event in events if event.get("tenant_id") == tenant_id]
        return sorted(events, key=lambda event: str(event.get("timestamp", "")), reverse=True)[:max(1, min(limit, 500))]

dynamic_stream_engine = DynamicEventStreamEngine()
