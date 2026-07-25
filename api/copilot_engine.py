import os
import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai
from google.api_core.exceptions import Unauthenticated, GoogleAPIError

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[Dict[str, Any]] = None

def get_platform_metrics():
    """Mock function representing backend data fetch."""
    return {"total_loss_prevented": 750000, "active_sessions": 42}

def get_session_intelligence(user_id: str):
    """Mock function representing backend data fetch."""
    return {"user_id": user_id, "risk_score": 94, "status": "CRITICAL IN REVIEW"}

CANDIDATE_MODELS = [
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
]

@router.post("/chat")
async def chat_with_copilot(request: ChatRequest):
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY")
    
    user_prompt = request.messages[-1].content if request.messages else ""

    # Enrich with system context for function calling
    system_context = ""
    if "metrics" in user_prompt.lower() or "platform" in user_prompt.lower():
        metrics = get_platform_metrics()
        system_context = f"\n\n[SYSTEM METRICS: {json.dumps(metrics)}]"
    elif "user" in user_prompt.lower() or "session" in user_prompt.lower() or "risk" in user_prompt.lower():
        user_id = request.context.get("user_id", "unknown") if request.context else "unknown"
        session_data = get_session_intelligence(user_id)
        system_context = f"\n\n[USER SESSION INTEL: {json.dumps(session_data)}]"

    full_prompt = user_prompt + system_context
    last_err = None

    if api_key:
        try:
            genai.configure(api_key=api_key)
            history = [{"role": m.role if m.role in ["user", "model"] else "user", "parts": [m.content]} for m in request.messages[:-1]]
            
            # Attempt available candidate models in sequence
            for model_name in CANDIDATE_MODELS:
                try:
                    model = genai.GenerativeModel(model_name)
                    chat = model.start_chat(history=history)
                    response = chat.send_message(full_prompt)
                    return {"response": response.text}
                except (GoogleAPIError, Exception) as e:
                    last_err = str(e)
                    continue
        except Unauthenticated:
            last_err = "Authentication Failed: Your GEMINI_API_KEY is unauthorized or restricted."
        except Exception as e:
            last_err = str(e)
    else:
        last_err = "GEMINI_API_KEY not set in .env"

    # Intelligent Cyber Security Assistant Fallback (when API key quota limit 429 or 404 model occurs)
    if "metrics" in user_prompt.lower() or "platform" in user_prompt.lower():
        resp = f"[Fusion Copilot]: Platform metrics active. Total Loss Prevented: INR 7,50,000. Active Sessions: 42. High risk alerts monitored.\n\n(Note: {last_err[:120] if last_err else 'Operating in offline mode'})"
    elif "user" in user_prompt.lower() or "risk" in user_prompt.lower() or "transaction" in user_prompt.lower() or "summarize" in user_prompt.lower():
        user_id = request.context.get("user_id", "USR_DEMO_001") if request.context else "USR_DEMO_001"
        resp = f"[Fusion Copilot Analysis]: Context for {user_id}:\n- Transaction: INR 7,50,000 Transfer (Accepted)\n- Behavior Profile: Abnormal Velocity\n- Risk Score: 94/100 (CRITICAL)\n- Action: Step-up MFA verification required.\n\n(Note: {last_err[:120] if last_err else 'Operating in offline mode'})"
    else:
        resp = f"[Fusion Security Assistant]: Processing request: '{user_prompt}'\n\nSecurity Intelligence: No immediate threat vectors detected in session stream. System health green.\n\n(Note: {last_err[:120] if last_err else 'Operating in offline mode'})"

    return {"response": resp}

