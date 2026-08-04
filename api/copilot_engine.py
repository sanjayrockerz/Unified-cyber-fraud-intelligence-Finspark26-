from __future__ import annotations

import json
import logging
import os
from typing import Any

from fastapi import APIRouter, Request
from pydantic import BaseModel
from dotenv import load_dotenv

try:
    import google.generativeai as genai
    from google.api_core.exceptions import GoogleAPIError, Unauthenticated
    GENAI_AVAILABLE = True
except ImportError:  # Optional dependency; the grounded response remains available.
    genai = None
    GENAI_AVAILABLE = False

    class GoogleAPIError(Exception):
        pass

    class Unauthenticated(Exception):
        pass

from api.store import list_all
from api.core_platform.graph_runtime import graph_runtime
from api.session_intelligence import session_intelligence
from api.cyber_threat_engine import cyber_threat_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/copilot", tags=["copilot"])


class ChatMessage(BaseModel):
    role: str
    content: str | None = None


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: dict[str, Any] | None = None


CANDIDATE_MODELS = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.0-flash"]


def gather_live_platform_state(tenant_id: str | None = None) -> dict[str, Any]:
    """Return only current persisted/runtime state; no illustrative fallback records."""
    transactions = list_all("transactions", tenant_id=tenant_id) or []
    cases = list_all("cases", tenant_id=tenant_id) or []
    customers = list_all("customers", tenant_id=tenant_id) or []
    threats = cyber_threat_engine.get_all_threats(tenant_id=tenant_id) or []
    topology = graph_runtime.topology(limit=100)
    sessions = session_intelligence.repository.list_sessions(limit=50)
    from api.synthetic_universe.dynamic_event_stream import dynamic_stream_engine

    blocked = [item for item in transactions if str(item.get("decision") or item.get("action") or "").upper() in {"BLOCK", "BLOCKED"}]
    return {
        "summary": {
            "transactions": len(transactions),
            "cases": len(cases),
            "customers": len(customers),
            "threats": len(threats),
            "active_sessions": len(sessions),
            "blocked_amount": sum(float(item.get("amount") or 0) for item in blocked),
            "graph_nodes": len(topology.get("nodes", [])),
            "graph_relationships": len(topology.get("links", [])),
        },
        "recent_transactions": transactions[:10],
        "recent_cases": cases[:10],
        "recent_threats": threats[:10],
        "recent_timeline": dynamic_stream_engine.get_unified_timeline(limit=10, tenant_id=tenant_id),
    }


def format_system_agent_prompt(state: dict[str, Any], context: dict[str, Any] | None) -> str:
    return f"""You are Fuzen AI, an evidence-grounded banking SOC investigation assistant.
Use only the supplied live platform state and active investigation context. Do not invent people,
transactions, scores, timestamps, incidents, or metrics. Return a JSON object with exactly these
fields: summary, classification, trust, severity, evidence, signals, timeline, impact, actions,
confidence, references. Values may be an empty array or 'Not observed' when telemetry is absent.

LIVE PLATFORM STATE:
{json.dumps(state, default=str)}

ACTIVE CONTEXT:
{json.dumps(context or {}, default=str)}
"""


def generate_grounded_fallback_response(query: str, state: dict[str, Any], context: dict[str, Any] | None) -> dict[str, Any]:
    summary = state.get("summary", {})
    threats = state.get("recent_threats", [])
    cases = state.get("recent_cases", [])
    timeline = state.get("recent_timeline", [])
    severity = "CRITICAL" if any(str(item.get("severity", "")).upper() == "CRITICAL" for item in threats + cases) else ("OBSERVED" if threats or cases else "UNAVAILABLE")
    return {
        "summary": "Current investigation assessment is grounded in the authenticated tenant telemetry snapshot.",
        "classification": [item.get("threat_category") or item.get("event_type") for item in threats[:5]] or ["No active classification observed"],
        "trust": context.get("trust") if context else "Adaptive trust is not available in the current response context.",
        "severity": severity,
        "evidence": state.get("recent_transactions", [])[:5] or ["No transaction evidence observed"],
        "signals": threats[:5] or ["No correlated threat signals observed"],
        "timeline": timeline or ["No timeline events observed"],
        "impact": {"blocked_amount": summary.get("blocked_amount", 0), "affected_cases": summary.get("cases", 0)},
        "actions": ["Review observed evidence", "Validate adaptive trust context", "Record analyst disposition"],
        "confidence": "Telemetry-grounded; confidence is unavailable unless returned by the model runtime.",
        "references": {"tenant_state": "SQLite and threat engine", "graph": f"{summary.get('graph_nodes', 0)} nodes / {summary.get('graph_relationships', 0)} relationships"},
    }


@router.post("/chat")
async def chat_with_copilot(request: ChatRequest, http_request: Request):
    load_dotenv(override=True)
    user_prompt = request.messages[-1].content if request.messages else ""
    tenant_id = getattr(http_request.state, "tenant", None)
    live_state = gather_live_platform_state(tenant_id=tenant_id)
    system_prompt = format_system_agent_prompt(live_state, request.context)
    api_key = os.getenv("GEMINI_API_KEY")

    if GENAI_AVAILABLE and api_key:
        try:
            genai.configure(api_key=api_key)
            for model_name in CANDIDATE_MODELS:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(f"{system_prompt}\nANALYST REQUEST:\n{user_prompt}")
                    if response and response.text:
                        return {"response": response.text, "source": "gemini", "state": live_state["summary"]}
                except (GoogleAPIError, Unauthenticated, Exception) as exc:
                    logger.warning("Copilot model attempt failed for %s: %s", model_name, exc)
        except Exception as exc:
            logger.warning("Copilot configuration failed: %s", exc)

    return {"investigation": generate_grounded_fallback_response(user_prompt or "", live_state, request.context), "source": "grounded_backend_state"}
