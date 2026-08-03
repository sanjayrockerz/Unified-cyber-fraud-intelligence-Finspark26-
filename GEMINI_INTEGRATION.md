# Gemini API Integration

## Strategy
We utilize the `google-generativeai` Python SDK to interact with the Gemini API, ensuring secure and efficient communication with the foundational model.

## Configuration
1.  **Dependency**: Added `google-generativeai>=0.8.0` to `requirements.txt`.
2.  **Authentication**: `GEMINI_API_KEY` must be configured in the `.env` file. The backend loads this on startup via `python-dotenv`.
3.  **Model Selection**: We default to `gemini-1.5-flash` for fast, responsive interactions suited for a Copilot experience. 

## FastAPI Endpoint Design
*   `POST /api/copilot/chat`: Accepts the conversation history and a new user prompt. Returns the AI response, potentially after interacting with internal functions.
*   `GET /api/copilot/suggestions`: Generates context-aware prompt suggestions based on the current state of the Operations Center.

## Error Handling & Resiliency
*   Implemented exponential backoff and retry logic for API rate limits.
*   Fallback static responses provided if the Gemini API is temporarily unavailable, ensuring the dashboard remains fully operational.
