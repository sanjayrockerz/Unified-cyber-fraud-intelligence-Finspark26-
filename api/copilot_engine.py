from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import google.generativeai as genai
import json

router = APIRouter(prefix="/api/copilot", tags=["copilot"])

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    context: Optional[Dict[str, Any]] = None

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    # Instantiate model
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

def get_platform_metrics():
    """Mock function representing backend data fetch."""
    return {"total_loss_prevented": 750000, "active_sessions": 42}

def get_session_intelligence(user_id: str):
    """Mock function representing backend data fetch."""
    return {"user_id": user_id, "risk_score": 94, "status": "CRITICAL IN REVIEW"}

@router.post("/chat")
async def chat_with_copilot(request: ChatRequest):
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured in .env")

    try:
        # Convert incoming messages to Gemini format
        history = [{"role": m.role, "parts": [m.content]} for m in request.messages[:-1]]
        chat = model.start_chat(history=history)
        
        user_prompt = request.messages[-1].content
        
        # Simple Function Calling Logic Route
        if "metrics" in user_prompt.lower():
            metrics = get_platform_metrics()
            user_prompt += f"\n\n[SYSTEM CONTEXT: {json.dumps(metrics)}]"
        elif "user" in user_prompt.lower() or "session" in user_prompt.lower():
            user_id = request.context.get("user_id", "unknown") if request.context else "unknown"
            session_data = get_session_intelligence(user_id)
            user_prompt += f"\n\n[SYSTEM CONTEXT: {json.dumps(session_data)}]"

        response = chat.send_message(user_prompt)
        
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
