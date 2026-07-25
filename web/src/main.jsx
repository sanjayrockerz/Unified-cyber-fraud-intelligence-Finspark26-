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
  document.getElementById('root').textContent = `Platform startup failed: ${error.message}`
})

window.addEventListener('error', (event) => {
  console.error('[global] uncaught error:', event.error || event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[global] unhandled promise rejection:', event.reason);
});
