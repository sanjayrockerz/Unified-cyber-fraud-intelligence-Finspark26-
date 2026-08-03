from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from api.cyber_threat_engine import CyberThreatEngine, cyber_threat_engine
from api.sdk_engine import FusionAdaptiveTrustSDKEngine, sdk_engine
from api.identity_trust.service import identity_trust
from api import store
from .graph_runtime import GraphRuntime, graph_runtime
from .model_runtime import ModelRuntime, model_runtime
from .decision_runtime import DecisionEngineAdapter, decision_engine
from .events import PlatformEventBroker, platform_event_broker
from api.synthetic_universe.dynamic_event_stream import dynamic_stream_engine


class PipelineValidationError(ValueError):
    pass


@dataclass
class PipelineResult:
    pipeline_id: str
    request_id: str
    correlation_id: str
    timestamp: str
    normalized_event: dict[str, Any]
    event_ack: dict[str, Any]
    threats: list[dict[str, Any]]
    graph: dict[str, Any]
    inference: dict[str, Any]
    decision: dict[str, Any]
    session_update: dict[str, Any] | None
    timings: dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "pipeline_id": self.pipeline_id,
            "request_id": self.request_id,
            "correlation_id": self.correlation_id,
            "timestamp": self.timestamp,
            "normalized_event": self.normalized_event,
            "event_ack": self.event_ack,
            "threats": self.threats,
            "graph": self.graph,
            "inference": self.inference,
            "decision": self.decision,
            "session_update": self.session_update,
            "timings": self.timings,
        }


class AuthoritativePlatformPipeline:
    """Single orchestration path for SDK and transaction security evaluation."""

    def __init__(
        self,
        sdk: FusionAdaptiveTrustSDKEngine = sdk_engine,
        threats: CyberThreatEngine = cyber_threat_engine,
        graph: GraphRuntime = graph_runtime,
        models: ModelRuntime = model_runtime,
        decisions: DecisionEngineAdapter = decision_engine,
        events: PlatformEventBroker = platform_event_broker,
    ):
        self.sdk = sdk
        self.threat_engine = threats
        self.graph_runtime = graph
        self.model_runtime = models
        self.decision_engine = decisions
        self.event_broker = events
        self._idempotency_lock = asyncio.Lock()
        self._inflight: dict[tuple[str, str], asyncio.Future[PipelineResult]] = {}

    @staticmethod
    def _transaction_hash(event: dict[str, Any]) -> str:
        identity = event.get("event_id") or event.get("txn_id") or event.get("request_id")
        material = {
            "tenant_id": event.get("tenant_id", ""),
            "session_id": event.get("session_id", ""),
            "event_type": event.get("event_type", ""),
            "identity": identity,
        }
        return hashlib.sha256(json.dumps(material, sort_keys=True).encode()).hexdigest()

    @staticmethod
    def is_processed(tenant_id: str, transaction_hash: str) -> bool:
        return store.is_processed(tenant_id, transaction_hash)

    @staticmethod
    def mark_processed(tenant_id: str, transaction_hash: str) -> bool:
        return store.mark_processed(tenant_id, transaction_hash)

    @staticmethod
    def normalize(payload: dict[str, Any]) -> dict[str, Any]:
        event = dict(payload)
        event_type = str(event.get("event_type") or event.get("type") or "").upper().strip()
        if not event_type:
            raise PipelineValidationError("event_type is required")
        session_id = str(event.get("session_id") or "").strip()
        if not session_id:
            raise PipelineValidationError("session_id is required")
        device_id = str(event.get("device_id") or "").strip()
        event["event_type"] = event_type
        event["session_id"] = session_id
        event["device_id"] = device_id
        event["tenant_id"] = str(event.get("tenant_id") or "").strip()
        event["amount"] = max(0.0, float(event.get("amount", 0.0) or 0.0))
        event["timestamp"] = str(
            event.get("timestamp") or datetime.now(timezone.utc).isoformat()
        )
        event.setdefault("event_id", f"EVT_{uuid.uuid4().hex[:12].upper()}")
        event.setdefault("request_id", f"REQ_{uuid.uuid4().hex[:16].upper()}")
        event.setdefault("correlation_id", f"COR_{uuid.uuid4().hex[:16].upper()}")
        return event

    async def process(
        self,
        payload: dict[str, Any],
        *,
        require_existing_session: bool,
        publish: bool = True,
    ) -> PipelineResult:
        event = self.normalize(payload)
        key = (event["session_id"], event["request_id"])
        owner = False
        async with self._idempotency_lock:
            future = self._inflight.get(key)
            if future is None:
                future = asyncio.get_running_loop().create_future()
                self._inflight[key] = future
                owner = True
        if not owner:
            return await asyncio.shield(future)
        tenant_id = event.get("tenant_id") or "__unscoped__"
        transaction_hash = self._transaction_hash(event)
        marked = False
        try:
            marked = self.mark_processed(tenant_id, transaction_hash)
            if not marked:
                raise PipelineValidationError("request has already been processed")
            result = await self._process_once(
                event,
                require_existing_session=require_existing_session,
                publish=publish,
            )
            if result.inference.get("status") == "degraded":
                # A degraded evaluation is retryable after the model is restored.
                store.unmark_processed(tenant_id, transaction_hash)
            async with self._idempotency_lock:
                self._inflight.pop(key, None)
                if not future.done():
                    future.set_result(result)
            return result
        except Exception as exception:
            if marked:
                store.unmark_processed(tenant_id, transaction_hash)
            async with self._idempotency_lock:
                self._inflight.pop(key, None)
                if not future.done():
                    future.set_exception(exception)
                    future.exception()
            raise

    async def _process_once(
        self,
        payload: dict[str, Any],
        *,
        require_existing_session: bool,
        publish: bool = True,
    ) -> PipelineResult:
        total_started = time.perf_counter()
        event = self.normalize(payload)
        pipeline_id = f"PIPE_{uuid.uuid4().hex[:12].upper()}"
        if require_existing_session and event["session_id"] not in self.sdk.sdk_sessions:
            raise PipelineValidationError("session_id is not active")

        stage_started = time.perf_counter()
        event_ack = self.sdk.ingest_event(event)
        normalize_ingest_ms = (time.perf_counter() - stage_started) * 1000.0

        stage_started = time.perf_counter()
        direct_threats = self.threat_engine.evaluate_event(event)
        threat_ms = (time.perf_counter() - stage_started) * 1000.0

        stage_started = time.perf_counter()
        graph_result = self.graph_runtime.process(event)
        graph_ms = (time.perf_counter() - stage_started) * 1000.0
        graph_payload = graph_result.to_dict()

        graph_threats: list[dict[str, Any]] = []
        if graph_result.findings:
            graph_event = {
                "session_id": event["session_id"],
                "device_id": event["device_id"],
                "user_id": event.get("user_id", "unknown"),
                "event_type": "GRAPH_INTELLIGENCE_RESULT",
                "_graph_backend": graph_result.backend,
                "_graph_findings": [
                    finding.to_dict() for finding in graph_result.findings
                ],
            }
            graph_threats = self.threat_engine.evaluate_event(graph_event)
        all_threats = direct_threats + graph_threats

        inference = self.model_runtime.infer(
            event,
            threats=all_threats,
            graph_findings=graph_payload["findings"],
        )
        decision = self.decision_engine.decide(inference, all_threats)
        decision["session_id"] = event["session_id"]
        
        # Record activity
        if event["event_type"] in {"TRANSFER", "QR_PAYMENT"}:
            identity_trust.record_activity(
                sdk_session_id=event["session_id"],
                event_type=event["event_type"],
                user_id=event.get("user_id", "unknown"),
                device_id=event.get("device_id", "unknown"),
                risk_delta=10.0 if all_threats else 0.0,
                metadata={"amount": event.get("amount", 0.0)}
            )

        total_ms = (time.perf_counter() - total_started) * 1000.0
        event_ack.update(
            {
                "backend_ack": True,
                "pipeline_id": pipeline_id,
                "request_id": event["request_id"],
                "correlation_id": event["correlation_id"],
            }
        )
        result = PipelineResult(
            pipeline_id=pipeline_id,
            request_id=event["request_id"],
            correlation_id=event["correlation_id"],
            timestamp=datetime.now(timezone.utc).isoformat(),
            normalized_event=event,
            event_ack=event_ack,
            threats=all_threats,
            graph=graph_payload,
            inference=inference.to_dict(),
            decision=decision,
            session_update=None,
            timings={
                "normalization_and_ingest_ms": round(normalize_ingest_ms, 3),
                "threat_engine_ms": round(threat_ms, 3),
                "graph_engine_ms": round(graph_ms, 3),
                "model_or_fallback_ms": inference.latency_ms,
                "total_ms": round(total_ms, 3),
            },
        )
        if publish:
            published_event = {
                    "msg_type": "pipeline_decision",
                    "session_id": event["session_id"],
                    "tenant_id": event["tenant_id"],
                    **result.to_dict(),
                }
            dynamic_stream_engine.record_event(published_event)
            await self.event_broker.publish(published_event)
        return result


platform_pipeline = AuthoritativePlatformPipeline()
