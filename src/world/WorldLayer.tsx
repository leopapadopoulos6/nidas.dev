import { Component, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { useLocation, useNavigate } from 'react-router'
import gsap from 'gsap'
import * as THREE from 'three'
import { bootEl, bootLine } from '../site/boot'
import { isSectionId, type SectionId } from '../site/sections'
import CameraRig from './CameraRig'
import District from './District'
import Effects from './Effects'
import Hud from './Hud'
import { input, isMoveKey } from './input'
import { SPAWN, type NodeId } from './layout'
import Packet from './Packet'
import { packet, rttFromDistance, useWorld } from './store'
import { theme } from './theme'
import './hud.css'

export interface WorldLayerProps {
  section?: SectionId
  onExit: () => void
  onFail: (e: Error | string) => void
}

const HOTKEYS: Record<string, NodeId> = { Digit1: 'about', Digit2: 'experience', Digit3: 'contact', Digit4: 'apps' }

// Read once: in-world navigation drops the query string.
const PINNED_FX = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('fx')
const pinnedFx = () => PINNED_FX === 'crt' || PINNED_FX === 'lite'

/** Fires once the first frame has rendered with physics running: the world is live. */
function Ready() {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    useWorld.getState().setReady()
  })
  return null
}

/** Catches errors from inside the 3D scene so the world can rebuild itself instead of quitting. */
class SceneBoundary extends Component<{ onError: (e: Error, componentStack: string) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    this.props.onError(error, info.componentStack ?? '')
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

// Waits between rebuild attempts within one incident (ms).
const BACKOFF = [600, 1500, 3000, 6000]

const coarsePointer = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

function hideBoot() {
  bootLine('', 'ok')
  const el = bootEl()
  if (!el) return
  gsap.to(el, {
    opacity: 0,
    duration: 0.45,
    ease: 'power1.out',
    onComplete: () => {
      el.style.display = 'none'
      el.style.opacity = ''
    },
  })
}

export default function WorldLayer({ section, onExit, onFail }: WorldLayerProps) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const ready = useWorld((s) => s.ready)
  const panel = useWorld((s) => s.panel)
  const quality = useWorld((s) => s.quality)
  // The scene can be rebuilt (new canvas, new GPU context) without leaving 3D: bumping `scene` remounts it,
  // and the packet, visited hops, open panel and any autopilot flight carry over.
  const [scene, setScene] = useState(0)
  const [trouble, setTrouble] = useState<null | 'recovering' | 'stuck'>(null)
  const [lowPower, setLowPower] = useState(false)
  const resets = useRef<number[]>([])
  // Only the canvas currently on screen may report trouble: R3F force-drops the context of a canvas it
  // tears down, and that must not count as a new failure.
  const liveCanvas = useRef<HTMLCanvasElement | null>(null)
  const labelLayer = useRef<HTMLDivElement>(null)
  const recovering = useRef(false)
  const started = useRef(performance.now())
  const shownAt = useRef(-Infinity) // when the page last came back from the background
  const diag = useRef<{ log: string[]; info: string; errors: string[] }>({ log: [], info: '', errors: [] })

  // Fresh session on every mount: spawn at hop 0. Done before the scene renders so the packet starts there.
  useState(() => {
    packet.pos.copy(SPAWN)
    packet.distance = 0
    useWorld.setState({ ready: false, current: null, panel: null, visited: ['gateway'], rtt: { gateway: 0.412 }, autopilot: null, moved: false })
  })

  // A failure within 2 s of mounting a rebuilt scene means the rebuild itself failed (the device can refuse
  // a new context while it frees memory): retry with growing waits instead of counting a new failure.
  const tries = useRef(0)
  const mountedAt = useRef(-Infinity)

  // Take the canvas down right away (no rendering into a dead context), then mount a new one.
  const remount = useCallback((delay: number) => {
    setTimeout(() => {
      recovering.current = false
      mountedAt.current = performance.now()
      setScene((n) => n + 1)
      setTrouble(null)
    }, delay)
  }, [])

  const giveUp = useCallback(() => {
    recovering.current = false
    tries.current = 0
    setTrouble('stuck')
  }, [])

  const rebuild = useCallback(
    (kind: 'lost' | 'error', detail = '') => {
      if (recovering.current) return // one event, one rebuild
      recovering.current = true
      liveCanvas.current = null
      const now = performance.now()
      const at = Math.round((performance.now() - started.current) / 1000)
      // Phones drop GPU contexts of pages in the background, and sometimes report it just after the page
      // comes back. That is not a failure of the site: rebuild, but don't count it.
      const background = document.visibilityState === 'hidden' || now - shownAt.current < 3000
      const failedRebuild = now - mountedAt.current < 2000
      diag.current.log.push(`${kind === 'lost' ? 'L' : 'E'}${at}s${background ? '(bg)' : ''}`)
      console.warn(`[nidas.dev] 3D scene reset: ${kind}${detail ? ` (${detail})` : ''}${background ? ' while in background' : ''}`)
      setTrouble('recovering')
      if (!pinnedFx()) useWorld.getState().setQuality('low')
      setLowPower(true)

      let delay = BACKOFF[0]
      if (background) {
        tries.current = 0
      } else if (failedRebuild) {
        tries.current += 1
        if (tries.current >= BACKOFF.length) return giveUp()
        delay = BACKOFF[tries.current]
      } else {
        tries.current = 0
        const t = Date.now()
        resets.current = [...resets.current.filter((x) => t - x < 60000), t]
        if (resets.current.length >= 3) return giveUp()
      }
      if (document.visibilityState === 'hidden') {
        const back = () => {
          if (document.visibilityState === 'hidden') return
          document.removeEventListener('visibilitychange', back)
          remount(delay)
        }
        document.addEventListener('visibilitychange', back)
        return
      }
      remount(delay)
    },
    [remount, giveUp],
  )

  const [copied, setCopied] = useState(false)
  const copyDiag = useCallback(() => {
    const text = [`nidas.dev 3D diagnostics · ${__BUILD__} · ${navigator.userAgent}`, `log: ${diag.current.log.join(' ')}`, `fx ${useWorld.getState().quality} · ${diag.current.info}`, ...diag.current.errors].join('\n')
    navigator.clipboard?.writeText(text).then(
      () => setCopied(true),
      () => setCopied(false),
    )
  }, [])

  const retry = useCallback(() => {
    resets.current = []
    tries.current = 0
    recovering.current = true
    setTrouble('recovering')
    remount(BACKOFF[0])
  }, [remount])

  useEffect(() => {
    const el = bootEl()
    if (el) el.style.display = ''
    const list = document.getElementById('boot-lines')
    if (list) list.innerHTML = '<li data-state="run"> 0  gw.visitor  resolving</li>'
    bootLine(' 1  world module  loaded')
    bootLine(' 2  physics + renderer  starting')
    const t = setTimeout(() => {
      if (!useWorld.getState().ready) onFail('timed out')
    }, 30000)
    useWorld.getState().setTouch(coarsePointer())
    const onVisible = () => {
      if (document.visibilityState === 'visible') shownAt.current = performance.now()
    }
    document.addEventListener('visibilitychange', onVisible)
    const onUncaught = (ev: ErrorEvent | PromiseRejectionEvent) => {
      const err = 'reason' in ev ? ev.reason : ev.error
      const msg = err instanceof Error ? `${err.name}: ${err.message}\n${(err.stack || '').split('\n').slice(0, 6).join('\n')}` : String('message' in ev ? ev.message : err)
      if (diag.current.errors.length < 3) diag.current.errors.push(`uncaught ${msg}`)
      diag.current.log.push(`U${Math.round((performance.now() - started.current) / 1000)}s`)
    }
    window.addEventListener('error', onUncaught)
    window.addEventListener('unhandledrejection', onUncaught)
    // Phones start on the light effects (no post-processing buffers): less graphics memory, fewer drops.
    if (coarsePointer()) useWorld.getState().setQuality('low')
    // ?fx=crt or ?fx=lite pins the effects tier (otherwise it drops to lite when frames are slow).
    if (PINNED_FX === 'lite') useWorld.getState().setQuality('low')
    if (PINNED_FX === 'crt') useWorld.getState().setQuality('high')
    return () => {
      clearTimeout(t)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('error', onUncaught)
      window.removeEventListener('unhandledrejection', onUncaught)
      liveCanvas.current = null // leaving 3D on purpose: ignore the teardown of the last canvas
      const b = bootEl()
      if (b) b.style.display = 'none'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (ready) hideBoot()
  }, [ready])

  // Keyboard: drive, hop shortcuts, close, respawn.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const s = useWorld.getState()
      if (isMoveKey(e.code) || e.code.startsWith('Shift')) {
        input.keys.add(e.code)
        if (e.code.startsWith('Arrow')) e.preventDefault()
        return
      }
      if (e.code === 'Escape' && s.panel) s.closePanel()
      else if (e.code === 'KeyR') s.respawn()
      else if (HOTKEYS[e.code]) s.goTo(HOTKEYS[e.code])
    }
    const up = (e: KeyboardEvent) => input.keys.delete(e.code)
    const blur = () => input.keys.clear()
    const touched = () => useWorld.getState().setTouch(true)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    window.addEventListener('touchstart', touched, { once: true, passive: true })
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      window.removeEventListener('touchstart', touched)
    }
  }, [])

  // URL -> world: a section route flies the packet there; "/" closes the panel.
  useEffect(() => {
    if (!ready) return
    const s = useWorld.getState()
    if (section && section !== s.panel && section !== s.autopilot) s.goTo(section)
    else if (!section && s.panel) s.closePanel()
  }, [section, ready])

  // World -> URL: the open panel is the route. Leave the URL alone while flying somewhere.
  useEffect(() => {
    if (!ready) return
    if (!panel && useWorld.getState().autopilot) return
    const want = panel ? `/${panel}` : '/'
    if (pathname !== want) navigate(want)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel, ready, navigate])

  const arrive = useCallback((id: NodeId) => {
    if (isSectionId(id) && id !== 'apps') useWorld.getState().openPanel(id)
  }, [])
  const deny = useCallback(() => {
    useWorld.getState().deny(rttFromDistance(packet.distance))
  }, [])
  const hitFirewall = useCallback(() => {
    if (!useWorld.getState().autopilot) deny()
  }, [deny])
  const pick = useCallback((id: NodeId) => useWorld.getState().goTo(id), [])

  // Phones get a lower render resolution (graphics memory is the usual reason a phone drops the 3D view).
  const dpr: [number, number] = lowPower ? [1, 1] : coarsePointer() ? [1, 1.25] : [1, 1.75]

  return (
    <div className={`world ${quality === 'low' ? 'is-lite' : ''}`}>
      {trouble === null && (
        <SceneBoundary
          key={scene}
          onError={(e, componentStack) => {
            // Keep the first few errors in full for the diagnostics block (message, stack, component stack).
            if (diag.current.errors.length < 3) {
              const where = (componentStack || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 6).join(' < ')
              diag.current.errors.push(`${e.name}: ${e.message}\n${(e.stack || '').split('\n').slice(0, 6).join('\n')}\ncomponents: ${where}`)
            }
            rebuild('error', e.message)
          }}
        >
          <Canvas
            className="world__canvas"
            dpr={dpr}
            gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
            camera={{ fov: theme.camera.fov, near: 0.1, far: 420, position: [packet.pos.x, 14, packet.pos.z + 14] }}
            onCreated={({ scene: s, gl }) => {
              const canvas = gl.domElement
              liveCanvas.current = canvas
              // The device dropped the GPU context (memory pressure, app switch): rebuild in place, stay in 3D.
              canvas.addEventListener('webglcontextlost', (e) => {
                e.preventDefault()
                if (liveCanvas.current === canvas) rebuild('lost')
              })
              gl.toneMapping = THREE.NeutralToneMapping
              const ctx = gl.getContext()
              const dbg = ctx.getExtension('WEBGL_debug_renderer_info')
              const gpu = String(dbg ? ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ctx.getParameter(ctx.RENDERER)).slice(0, 40)
              diag.current.info = `${canvas.width}x${canvas.height}@${gl.getPixelRatio()} · ${gpu}`
              mountedAt.current = performance.now()
              s.background = new THREE.Color(theme.background)
              s.fog = new THREE.FogExp2(theme.background, theme.fogDensity)
              bootLine(' 3  spawning packet at hop 0')
            }}
            aria-label="3D network district. Use the autopilot buttons or the text version to navigate."
          >
            <PerformanceMonitor onDecline={() => !pinnedFx() && useWorld.getState().setQuality('low')} flipflops={2}>
              <Suspense fallback={null}>
                <Physics gravity={[0, 0, 0]} timeStep={1 / 60}>
                  <District onPick={pick} onFirewall={hitFirewall} labels={labelLayer} />
                  <Packet onArrive={arrive} onDeny={deny} />
                  <Ready />
                </Physics>
              </Suspense>
              <CameraRig />
              <Effects />
            </PerformanceMonitor>
          </Canvas>
        </SceneBoundary>
      )}
      <div ref={labelLayer} className="world__labels" aria-hidden="true" />
      <Hud onExit={onExit} />
      {trouble === 'recovering' && (
        <p className="world__notice" role="status">
          &gt; link flap: graphics reset, reconnecting…
        </p>
      )}
      {trouble === 'stuck' && (
        <div className="world__stuck" role="alertdialog" aria-labelledby="stuck-title">
          <p id="stuck-title" className="world__stuck-title">
            &gt; the 3D view keeps resetting on this device
          </p>
          <p>Your browser keeps dropping the graphics context, usually because it is short on memory.</p>
          <p className="world__diag">
            diag: {diag.current.log.join(' ')} · fx {useWorld.getState().quality} · {diag.current.info} · {__BUILD__}
          </p>
          {diag.current.errors.length > 0 && <pre className="world__diag-errors">{diag.current.errors.join('\n---\n')}</pre>}
          <div className="world__stuck-actions">
            <button type="button" className="primary" onClick={retry}>
              restart 3D
            </button>
            <button type="button" onClick={onExit}>
              read the text version
            </button>
            <button type="button" onClick={copyDiag}>
              {copied ? 'copied' : 'copy diagnostics'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
