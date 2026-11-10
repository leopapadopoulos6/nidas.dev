import { Suspense, useCallback, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Physics } from '@react-three/rapier'
import { useNavigate } from 'react-router'
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

const HOTKEYS: Record<string, NodeId> = { Digit1: 'about', Digit2: 'experience', Digit3: 'projects', Digit4: 'contact', Digit5: 'apps' }

const pinnedFx = () => new URLSearchParams(window.location.search).has('fx')

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
  const ready = useWorld((s) => s.ready)
  const panel = useWorld((s) => s.panel)

  // Fresh session on every mount: spawn at hop 0.
  useEffect(() => {
    packet.pos.copy(SPAWN)
    packet.distance = 0
    useWorld.setState({ ready: false, current: null, panel: null, visited: ['gateway'], rtt: { gateway: 0.412 }, autopilot: null, moved: false })
    const el = bootEl()
    if (el) el.style.display = ''
    const list = document.getElementById('boot-lines')
    if (list) list.innerHTML = '<li data-state="run"> 0  gw.visitor  resolving</li>'
    bootLine(' 1  world module  loaded')
    bootLine(' 2  physics + renderer  starting')
    const t = setTimeout(() => {
      if (!useWorld.getState().ready) onFail('timed out')
    }, 30000)
    const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
    useWorld.getState().setTouch(touch)
    // ?fx=crt or ?fx=lite pins the effects tier (otherwise it drops to lite when frames are slow).
    const fx = new URLSearchParams(window.location.search).get('fx')
    if (fx === 'lite') useWorld.getState().setQuality('low')
    if (fx === 'crt') useWorld.getState().setQuality('high')
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
    if (window.location.pathname !== want) navigate(want)
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

  return (
    <div className="world">
      <Canvas
        className="world__canvas"
        dpr={[1, 1.75]}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
        camera={{ fov: theme.camera.fov, near: 0.1, far: 420, position: [SPAWN.x, 14, SPAWN.z + 14] }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(theme.background)
          scene.fog = new THREE.FogExp2(theme.background, theme.fogDensity)
          bootLine(' 3  spawning packet at hop 0')
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
      <Hud onExit={onExit} />
    </div>
  )
}
