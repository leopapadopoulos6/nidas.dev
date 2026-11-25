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
class SceneBoundary extends Component<{ onError: (e: Error) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    this.props.onError(error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

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
  // The scene can be rebuilt (new canvas, new GPU context) without leaving 3D: bumping `scene` remounts it,
  // and the packet, visited hops, open panel and any autopilot flight carry over.
  const [scene, setScene] = useState(0)
  const [trouble, setTrouble] = useState<null | 'recovering' | 'stuck'>(null)
  const [lowPower, setLowPower] = useState(false)
  const resets = useRef<number[]>([])

  // Fresh session on every mount: spawn at hop 0. Done before the scene renders so the packet starts there.
  useState(() => {
    packet.pos.copy(SPAWN)
    packet.distance = 0
    useWorld.setState({ ready: false, current: null, panel: null, visited: ['gateway'], rtt: { gateway: 0.412 }, autopilot: null, moved: false })
  })

  const rebuild = useCallback((why: string) => {
    const now = Date.now()
    resets.current = [...resets.current.filter((t) => now - t < 60000), now]
    console.warn(`[nidas.dev] 3D view reset: ${why}`)
    // A reset usually means the device ran short of graphics memory: use the light effects at 1x resolution.
    if (!pinnedFx()) useWorld.getState().setQuality('low')
    setLowPower(true)
    if (resets.current.length >= 3) {
      setTrouble('stuck')
      return
    }
    setTrouble('recovering')
    setTimeout(() => setScene((n) => n + 1), 500)
  }, [])

  const retry = useCallback(() => {
    resets.current = []
    setTrouble('recovering')
    setScene((n) => n + 1)
  }, [])

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
    // ?fx=crt or ?fx=lite pins the effects tier (otherwise it drops to lite when frames are slow).
    if (PINNED_FX === 'lite') useWorld.getState().setQuality('low')
    if (PINNED_FX === 'crt') useWorld.getState().setQuality('high')
    return () => {
      clearTimeout(t)
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
  const dpr: [number, number] = lowPower ? [1, 1] : coarsePointer() ? [1, 1.5] : [1, 1.75]

  return (
    <div className="world">
      {trouble !== 'stuck' && (
        <SceneBoundary key={scene} onError={(e) => rebuild(e.message)}>
          <Canvas
            className="world__canvas"
            dpr={dpr}
            gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
            camera={{ fov: theme.camera.fov, near: 0.1, far: 420, position: [packet.pos.x, 14, packet.pos.z + 14] }}
            onCreated={({ scene: s, gl }) => {
              // The device dropped the GPU context (memory pressure, app switch): rebuild in place, stay in 3D.
              gl.domElement.addEventListener(
                'webglcontextlost',
                (e) => {
                  e.preventDefault()
                  rebuild('graphics context lost')
                },
                { once: true },
              )
              s.background = new THREE.Color(theme.background)
              s.fog = new THREE.FogExp2(theme.background, theme.fogDensity)
              bootLine(' 3  spawning packet at hop 0')
              setTrouble((t) => (t === 'recovering' ? null : t))
            }}
            aria-label="3D network district. Use the autopilot buttons or the text version to navigate."
          >
            <PerformanceMonitor onDecline={() => !pinnedFx() && useWorld.getState().setQuality('low')} flipflops={2}>
              <Suspense fallback={null}>
                <Physics gravity={[0, 0, 0]} timeStep={1 / 60}>
                  <District onPick={pick} onFirewall={hitFirewall} />
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
          <div className="world__stuck-actions">
            <button type="button" className="primary" onClick={retry}>
              restart 3D
            </button>
            <button type="button" onClick={onExit}>
              read the text version
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
