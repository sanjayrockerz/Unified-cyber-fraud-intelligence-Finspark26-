# RAG (Retrieval-Augmented Generation) Implementation

## Objective
To provide the Gemini Copilot with domain-specific knowledge about internal cyber fraud policies, compliance regulations, and historical case precedents without needing to fine-tune the model.

## Implementation Details
While full vector-store-based RAG requires extensive infrastructure, our initial implementation utilizes a simplified semantic retrieval approach:
1.  **Knowledge Base**: Standard Operating Procedures (SOPs), policy documents, and rule definitions are indexed.
2.  **Context Injection**: When an analyst queries the Copilot regarding "compliance" or "policy", the backend retrieves the relevant top-K documents.
3.  **Prompt Augmentation**: The retrieved documents are injected into the system prompt behind the scenes before dispatching the query to Gemini.

## Benefits
*   **Accuracy**: Drastically reduces hallucinations by grounding answers in factual, company-specific documentation.
*   **Auditability**: Allows the Copilot to cite specific internal documents (e.g., "According to Anti-Mule Policy v2.1...").
