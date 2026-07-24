# Function Calling Implementation

## Concept
Function calling allows the AI Copilot to interact deterministically with the platform's backend services. Instead of guessing data, Gemini can request to execute backend logic, which the FastAPI router fulfills and returns.

## Core Functions Provided to Gemini
1.  **`get_session_intelligence(user_id: str)`**: Fetches live risk scores, device anomalies, and active sessions for a specific user.
2.  **`get_platform_metrics()`**: Retrieves high-level operational statistics (e.g., total transactions blocked, average latency).
3.  **`query_transaction_logs(query_params: dict)`**: Pulls historical transaction details based on specific criteria (e.g., time window, amount threshold).

## Execution Flow
1.  **Definition**: Tools are defined using Pydantic schemas in FastAPI and registered with the Gemini model setup.
2.  **Evaluation**: When a prompt is received, Gemini assesses if its built-in knowledge is sufficient. If not, it emits a `function_call` event.
3.  **Routing**: The backend intercepts this event, matches the requested function to the Python implementation, and executes it.
4.  **Synthesis**: The result is serialized and returned to Gemini, which then constructs the final natural language answer for the user.
