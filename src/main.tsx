import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { storage } from './services/storage'

// Expose storage for browser debugging and automated E2E verification
if (typeof window !== 'undefined') {
  (window as any).storage = storage;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
