// Phase 1 research: summary numbers and the shortlist shown on the concept board.
// Thumbnails live in public/concepts/research/<slug>-{desktop,mobile}.webp

export interface Reference {
  slug: string
  name: string
  url: string
  kind: string // what the site is, in a few words
  oneLine: string
  learn: string
  avoid: string
  trust: 'ok' | 'flagged' // flagged = headless WebGL render not trustworthy
  trustNote?: string
  favorite?: boolean
}

export const funnel = [
  { n: '2,100', label: 'entries in developer-portfolios feed.json' },
  { n: '2,054', label: 'alive (HTTP 2xx, not parked or placeholder)' },
  { n: '292', label: 'create a WebGL or WebGPU context at runtime' },
  { n: '150', label: 'highest-signal candidates screenshotted (desktop + mobile)' },
  { n: '15', label: 'shortlisted for Packet, plus the two favorites' },
]

export const method = [
  'Keyword filter on name, URL and tagline (3D, three.js, WebGL, game, driving, explorable, interactive, cyberpunk, creative developer). Only 40 entries matched, because taglines are sparse.',
  'So every live homepage was also loaded in headless Chromium with canvas.getContext() instrumented, which catches 3D sites whose metadata says nothing.',
  'WebGL sites were probed again for three.js (window.__THREE__), canvas coverage of the viewport, draw calls per second, and keyboard listeners (a strong sign of drivable controls). A score from these signals plus keywords picked the top 150.',
  'Each candidate was captured at 1440×900 and at 390×844 (iPhone UA, touch). Software WebGL (SwiftShader) runs at 1–3 fps, so heavy scenes may show loaders or half-built frames. Those shots are flagged below and were judged with that in mind.',
]

export const shortlist: Reference[] = []

export const favorites: Reference[] = []
