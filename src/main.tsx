import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// Site routes ship prerendered HTML stamped with their route (see scripts/prerender.mjs).
// Hydrate only when that HTML belongs to this URL; otherwise (a host serving a fallback page)
// start clean.
const norm = (p: string) => p.replace(/\/+$/, '') || '/'
if (root.dataset.route && norm(root.dataset.route) === norm(location.pathname)) hydrateRoot(root, app)
else {
  root.textContent = ''
  createRoot(root).render(app)
}
