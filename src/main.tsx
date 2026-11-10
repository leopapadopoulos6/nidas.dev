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

// Site routes ship prerendered HTML (see scripts/prerender.mjs); hydrate those, render the rest.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
