import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { bootstrapPlatformAuth, installAuthenticatedFetch } from './platformAuth'

async function start() {
  await bootstrapPlatformAuth()
  installAuthenticatedFetch()
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}

start().catch((error) => {
  const root = document.getElementById('root')
  if (!root) return
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#07111f;color:#e6edf7;font-family:system-ui,sans-serif;padding:24px;text-align:center">
      <section role="alert" aria-live="assertive">
        <h1>Service temporarily unavailable</h1>
        <p>The platform is reconnecting automatically. Monitoring continues in the background.</p>
        <button type="button" onclick="window.location.reload()">Retry</button>
      </section>
    </main>`
})

window.addEventListener('error', (event) => {
  console.error('[global] uncaught error:', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[global] unhandled promise rejection:', event.reason);
});
