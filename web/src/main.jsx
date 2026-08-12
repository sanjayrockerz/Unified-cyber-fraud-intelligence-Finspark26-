import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'
import { bootstrapPlatformAuth, installAuthenticatedFetch } from './platformAuth'

const root = document.getElementById('root')

function renderLoading() {
  if (!root) return
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;background:#07111f;color:#e6edf7;font-family:system-ui,sans-serif;padding:24px;text-align:center">
      <section role="status" aria-live="polite">
        <div style="width:34px;height:34px;border:3px solid #263755;border-top-color:#7c5cff;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px"></div>
        <h1 style="font-size:20px;margin:0 0 8px">Starting Fuzen AI Command Center</h1>
        <p style="color:#9aa9c2;margin:0">Establishing a secure monitoring session…</p>
      </section>
    </main>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`
}

function renderApp() {
  if (!root) return
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}

renderLoading()

async function start() {
  try {
    await bootstrapPlatformAuth()
    installAuthenticatedFetch()
    window.__FUSION_AUTH_READY__ = true
  } catch (error) {
    // Render the dashboard even if deployment secrets/API availability are
    // wrong. API-backed panels can report their own connection state and the
    // operator can fix the Vercel/Render variables without a white screen.
    window.__FUSION_AUTH_ERROR__ = error?.message || 'Authentication unavailable'
    console.error('[platform-auth] startup failed:', error)
  }
  renderApp()
}

start().catch((error) => {
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
