import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import Holding from './pages/Holding'
import './base.css'

const ConceptBoard = lazy(() => import('./concepts/ConceptBoard'))
const Prototype = lazy(() => import('./concepts/proto/Prototype'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="route-loading">loading…</div>}>
        <Routes>
          <Route path="/" element={<Holding />} />
          <Route path="/concepts" element={<ConceptBoard />} />
          <Route path="/concepts/proto/:direction" element={<Prototype />} />
          <Route path="*" element={<Holding notFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
