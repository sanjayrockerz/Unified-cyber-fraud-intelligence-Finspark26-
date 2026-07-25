import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:8000' : '');

export default function AICopilotPanel({ activeContext }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          context: activeContext,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...newMessages, { role: 'model', content: data.response }]);
      } else {
        setMessages([...newMessages, { role: 'model', content: "Error connecting to AI Copilot." }]);
      }
    } catch (e) {
      setMessages([...newMessages, { role: 'model', content: "Failed to fetch response." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-soc-surface border-l border-soc-border shadow-xl">
      <div className="p-4 border-b border-soc-border bg-soc-panel">
        <h2 className="text-sm font-bold text-soc-text font-mono">Fusion AI Copilot</h2>
        <p className="text-xs text-soc-muted font-mono mt-1">Context-aware cybersecurity assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm select-text">
        {messages.map((msg, idx) => (
          <div key={idx} className={`relative p-3 rounded-lg group ${msg.role === 'user' ? 'bg-soc-primary/20 text-soc-text self-end ml-8 border border-soc-primary/40' : 'bg-soc-panel text-soc-text mr-8 border border-soc-border'}`}>
            <div className="whitespace-pre-wrap select-text">{msg.content}</div>
            <button
              onClick={() => handleCopy(msg.content, idx)}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-2 py-1 bg-soc-surface border border-soc-border text-soc-muted hover:text-soc-text rounded"
              title="Copy message"
            >
              {copiedIdx === idx ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
        ))}
        {loading && <div className="text-soc-muted animate-pulse">Copilot is thinking...</div>}
      </div>

      <div className="p-4 border-t border-soc-border bg-soc-bg">
        <div className="flex gap-2 mb-2">
          {["Summarize this transaction", "Check user risk", "Platform metrics"].map((chip) => (
            <button key={chip} onClick={() => setInput(chip)} className="text-[10px] px-2 py-1 rounded-full bg-soc-surface border border-soc-border text-soc-muted hover:text-soc-text transition-colors">
              {chip}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-soc-surface border border-soc-border rounded-lg px-3 py-2 text-soc-text text-sm focus:outline-none focus:border-soc-primary select-text"
            placeholder="Ask Copilot anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage} className="px-4 py-2 bg-soc-primary text-soc-onPrimary font-bold rounded-lg hover:bg-soc-primary/90 transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
