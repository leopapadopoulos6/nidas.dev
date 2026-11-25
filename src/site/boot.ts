// Bridge to the inline boot script in index.html, which decides 2D vs 3D before first paint.

export type Mode = '2d' | '3d'

declare global {
  interface Window {
    __PACKET__?: { mode: Mode; gl: 0 | 1; why?: string }
  }
}

const KEY = 'packet:mode'

export function bootMode(): Mode {
  if (typeof window === 'undefined') return '2d'
  return window.__PACKET__?.mode ?? '2d'
}

export function setPref(mode: Mode) {
  if (window.__PACKET__) window.__PACKET__.mode = mode
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    /* storage can be unavailable (private mode); the choice then lasts for this page only */
  }
}

export function setHtmlMode(mode: Mode) {
  document.documentElement.dataset.mode = mode
}

/** Static terminal loader that ships in index.html (#boot). */
export const bootEl = () => (typeof document === 'undefined' ? null : document.getElementById('boot'))

export function bootLine(text: string, state: 'run' | 'ok' | 'fail' = 'run') {
  const list = document.getElementById('boot-lines')
  if (!list) return
  const last = list.lastElementChild as HTMLElement | null
  if (last && last.dataset.state === 'run') {
    last.dataset.state = state === 'run' ? 'ok' : state
  }
  if (state === 'run') {
    const li = document.createElement('li')
    li.textContent = text
    li.dataset.state = 'run'
    list.appendChild(li)
  }
}
