# Fusion AI Copilot Architecture

## Overview
The Fusion AI Copilot serves as an interactive intelligence layer on top of the existing pre-transaction security platform. By leveraging the Gemini API and robust backend function-calling, the Copilot provides natural language insights, dynamically fetches live system data, and integrates directly into the Operations Center interface.

## Components

### 1. Backend Integration (FastAPI + Gemini)
*   **Copilot Engine (`api/copilot_engine.py`)**: A dedicated module that handles all AI interactions.
*   **Gemini API**: Used as the core LLM for reasoning and generating natural language responses.
*   **Function Calling Router**: Evaluates user prompts, maps them to backend data-fetching functions (e.g., querying database, fetching active session metrics), and supplies that context to Gemini for summarization.

### 2. Frontend Interface (React)
*   **AI Copilot Panel (`web/src/components/copilot/AICopilotPanel.jsx`)**: A slide-out or side-panel component built into the Operations Center.
*   **State Management**: Real-time context sharing (e.g., currently viewed user/transaction) passed to the Copilot backend to ground AI responses in the user's immediate operational context.

### 3. Data Flow
1.  **User Prompt**: Analyst asks a question in the Operations Center.
2.  **Context Augmentation**: Frontend bundles the prompt with active session/transaction IDs.
3.  **Function Execution**: Backend determines if live data is needed, calls the corresponding tools/functions, and receives structured data.
4.  **AI Summarization**: Gemini synthesizes the structured data into actionable insights.
5.  **Delivery**: The response is streamed or delivered via JSON to the frontend.
