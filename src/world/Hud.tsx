import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import gsap from 'gsap'
import { bodies } from '../site/bodies'
import { sectionById, sections, type SectionId } from '../site/sections'
import { input } from './input'
import { nodeById, nodes, type NodeId } from './layout'
import { packet, rttFromDistance, useWorld } from './store'

const fmt = (ms?: number) => (ms === undefined ? '…' : `${ms.toFixed(3)} ms`)
const hopHost = (id: NodeId) => (id === 'gateway' ? 'gw.visitor' : sectionById(id)!.host)
const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

function Trace() {
  const visited = useWorld((s) => s.visited)
  const rtt = useWorld((s) => s.rtt)
  const current = useWorld((s) => s.current)
  const panel = useWorld((s) => s.panel)
  const here = panel ?? current
  return (
    <section className="hud__trace" aria-label="Traceroute">
      <p className="hud__cmd">$ traceroute nidas.dev</p>
      <ol className="hud__hops">
        {nodes.map((n) => {
          const seen = visited.includes(n.id)
          const denied = n.id === 'apps'
          return (
            <li key={n.id} className={`${n.id === here ? 'is-current' : ''} ${seen ? 'is-seen' : 'is-pending'} ${denied ? 'is-denied' : ''}`}>
              <span className="h-n">{String(n.hop).padStart(2, ' ')}</span>
              <span className="h-host">{hopHost(n.id)}</span>
              <span className="h-ms">{denied ? (seen ? 'DENIED' : '* * *') : fmt(rtt[n.id])}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function Stats() {
  const visited = useWorld((s) => s.visited)
  const current = useWorld((s) => s.current)
  const panel = useWorld((s) => s.panel)
  const [ms, setMs] = useState(rttFromDistance(0))
  useEffect(() => {
    const t = setInterval(() => setMs(rttFromDistance(packet.distance)), 150)
    return () => clearInterval(t)
  }, [])
  const here = panel ?? current
  const hop = here ? nodeById(here).hop : Math.max(...visited.map((v) => nodeById(v).hop))
  return (
    <section className="hud__stats" aria-label="Packet status">
      <div>
        <span>TTL</span>
        <b>{64 - (visited.length - 1)}</b>
      </div>
      <div>
        <span>HOP</span>
        <b>
          {hop}/{nodes.length - 1}
        </b>
      </div>
      <div>
        <span>RTT</span>
        <b>
          {ms.toFixed(1)}
          <small>ms</small>
        </b>
      </div>
    </section>
  )
}

function Chips() {
  const goTo = useWorld((s) => s.goTo)
  const panel = useWorld((s) => s.panel)
  const autopilot = useWorld((s) => s.autopilot)
  return (
    <nav className="hud__route" aria-label="Autopilot: fly to a section">
      <span className="hud__route-label">autopilot</span>
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`${s.id === panel ? 'is-current' : ''} ${s.id === autopilot ? 'is-going' : ''} ${s.id === 'apps' ? 'is-locked' : ''}`}
          onClick={() => goTo(s.id)}
        >
          {s.id === 'apps' ? '✕ /apps' : `${String(s.hop).padStart(2, '0')} ${s.label}`}
        </button>
      ))}
    </nav>
  )
}

function Hint() {
  const moved = useWorld((s) => s.moved)
  const touch = useWorld((s) => s.touch)
  const [timeUp, setTimeUp] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimeUp(true), 14000)
    return () => clearTimeout(t)
  }, [])
  if (moved || timeUp) return null
  return (
    <p className="hud__hint" role="note">
      {touch ? '> drag the stick to drive, or tap a hop below' : '> drive with WASD or the arrow keys, or pick a hop below'}
    </p>
  )
}

function Stick() {
  const pad = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const id = useRef<number | null>(null)
  const move = (e: RPointerEvent) => {
    const el = pad.current
    if (!el || id.current !== e.pointerId) return
    const r = el.getBoundingClientRect()
    let x = e.clientX - (r.left + r.width / 2)
    let y = e.clientY - (r.top + r.height / 2)
    const max = r.width * 0.42
    const l = Math.hypot(x, y)
    if (l > max) {
      x = (x / l) * max
      y = (y / l) * max
    }
    input.stick.x = x / max
    input.stick.y = -y / max
    if (knob.current) knob.current.style.transform = `translate(${x}px, ${y}px)`
  }
  const end = () => {
    id.current = null
    input.stick.active = false
    input.stick.x = input.stick.y = 0
    if (knob.current) knob.current.style.transform = ''
  }
  return (
    <div
      ref={pad}
      className="hud__stick"
      role="application"
      aria-label="Drive: drag to steer"
      onPointerDown={(e) => {
        id.current = e.pointerId
        input.stick.active = true
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        useWorld.getState().markMoved()
        move(e)
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={knob} className="hud__stick-knob" />
    </div>
  )
}

function Panel() {
  const panel = useWorld((s) => s.panel)
  const rtt = useWorld((s) => s.rtt)
  const closePanel = useWorld((s) => s.closePanel)
  const goTo = useWorld((s) => s.goTo)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (panel) heading.current?.focus({ preventScroll: true })
  }, [panel])
  if (!panel) return null
  const meta = sectionById(panel)!
  const Body = bodies[panel]
  const order: SectionId[] = ['about', 'experience', 'projects', 'contact']
  const i = order.indexOf(panel)
  const next = panel === 'apps' ? 'experience' : order[(i + 1) % order.length]
  const title = panel === 'apps' ? 'ACCESS DENIED' : meta.label
  return (
    <article key={panel} className={`hud__panel ${panel === 'apps' ? 'is-denied' : ''}`} aria-labelledby="panel-title">
      <header>
        <p className="hud__panel-hop">
          hop {String(meta.hop).padStart(2, '0')} · {meta.host} · {panel === 'apps' ? 'deny' : fmt(rtt[panel])}
        </p>
        <h1 id="panel-title" ref={heading} tabIndex={-1} style={{ ['--n' as string]: title.length + 2 }}>
          <span className="type">{`> ${title}`}</span>
        </h1>
      </header>
      <div className="hud__panel-body">
        <Body />
      </div>
      <footer>
        <button type="button" className="primary" onClick={() => goTo(next)}>
          {panel === 'apps' ? 'back to hop 02 →' : `next hop: ${sectionById(next)!.label} →`}
        </button>
        <button type="button" onClick={closePanel}>
          [esc] close
        </button>
      </footer>
    </article>
  )
}

/** Scanline roll that sweeps the screen when you arrive somewhere. */
function Roll() {
  const el = useRef<HTMLDivElement>(null)
  const arrivals = useWorld((s) => s.arrivals)
  const denials = useWorld((s) => s.denials)
  useEffect(() => {
    if (!el.current || arrivals + denials === 0 || reducedMotion()) return
    const tl = gsap.fromTo(el.current, { yPercent: -20, opacity: 0.9 }, { yPercent: 120, opacity: 0.2, duration: 0.45, ease: 'power1.in' })
    return () => {
      tl.kill()
    }
  }, [arrivals, denials])
  return <div ref={el} className={`hud__roll ${denials ? 'is-denied' : ''}`} aria-hidden="true" />
}

function Announcer() {
  const panel = useWorld((s) => s.panel)
  const meta = panel ? sectionById(panel) : undefined
  return (
    <p className="sr-only" aria-live="polite">
      {meta ? (panel === 'apps' ? 'Access denied at the firewall.' : `Arrived at hop ${meta.hop}, ${meta.label}.`) : ''}
    </p>
  )
}

export default function Hud({ onExit }: { onExit: () => void }) {
  const quality = useWorld((s) => s.quality)
  const setQuality = useWorld((s) => s.setQuality)
  const touch = useWorld((s) => s.touch)
  const respawn = useWorld((s) => s.respawn)
  return (
    <div className={`hud ${touch ? 'is-touch' : ''}`}>
      <Roll />
      <Trace />
      <div className="hud__top-right">
        <button type="button" className="hud__skip" onClick={onExit}>
          skip to 2D →
        </button>
        <Stats />
        <div className="hud__tools">
          <button type="button" onClick={() => setQuality(quality === 'high' ? 'low' : 'high')} aria-label={`Effects: ${quality}. Toggle.`}>
            [fx: {quality === 'high' ? 'crt' : 'lite'}]
          </button>
          <button type="button" onClick={respawn} aria-label="Respawn at hop 0">
            [r] respawn
          </button>
        </div>
      </div>
      <Hint />
      <Chips />
      <p className="hud__keys" aria-hidden="true">
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd> drive · <kbd>shift</kbd> boost · <kbd>1</kbd>–<kbd>5</kbd> autopilot · <kbd>esc</kbd> close
      </p>
      <Stick />
      <Panel />
      <Announcer />
    </div>
  )
}
