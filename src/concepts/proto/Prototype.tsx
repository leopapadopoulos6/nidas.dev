import { Suspense, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Canvas } from '@react-three/fiber'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/vt323/400.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource-variable/tektur/wdth.css'
import '@fontsource-variable/martian-mono/wdth.css'
import { directionById, directions } from '../directions'
import { firewall, nodes } from './layout'
import World from './World'
import './hud.css'

const ABOUT = {
  title: 'About',
  lead: 'Network engineer in New York. I design, cable, and keep alive the networks small companies run on.',
  body: 'Client site engineering at Promenet: VLANs and trunking, HA/failover, firewall migrations, wireless surveys, and structured cabling. Working toward CCNA and moving toward security.',
  facts: [
    ['role', 'Network Engineer, Promenet, Inc.'],
    ['based', 'NYC'],
    ['since', '2024'],
    ['next', 'CCNA → security'],
  ],
}

export default function Prototype() {
  const { direction } = useParams()
  const [sp] = useSearchParams()
  const dir = directionById(direction) ?? directions[0]
  const fixedU = sp.has('u') ? Number(sp.get('u')) : undefined
  const fixedT = sp.has('t') ? Number(sp.get('t')) : undefined
  const panelNode = sp.get('panel') ?? undefined
  const showHud = sp.get('hud') !== '0'
  const hi = sp.get('hq') === '1'
  const [hop, setHop] = useState(-1)
  const shownHop = panelNode ? (nodes.find((n) => n.id === panelNode)?.hop ?? hop) : sp.has('hop') ? Number(sp.get('hop')) : hop
  const ttl = 64 - Math.max(0, shownHop)
  const nextHop = shownHop < 0 ? 1 : Math.min(shownHop + 1, nodes.length - 1)
  const latency = useMemo(() => (shownHop >= 0 ? nodes[shownHop].latency : nodes[Math.max(0, nextHop - 1)].latency), [shownHop, nextHop])

  return (
    <div className={`proto proto--${dir.id}`}>
      <Canvas
        className="proto__canvas"
        dpr={hi ? [1, 2] : [1, 1.5]}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, depth: true, preserveDrawingBuffer: hi }}
        camera={{ fov: dir.theme.camera.fov, near: 0.1, far: 400, position: [0, 6, 50] }}
      >
        <Suspense fallback={null}>
          <World key={dir.id} theme={dir.theme} directionId={dir.id} fixedU={fixedU} fixedT={fixedT} panelNode={panelNode} onHop={setHop} hiQuality={hi} />
        </Suspense>
      </Canvas>

      {showHud && (
        <div className={`hud hud--${dir.id}`}>
          <section className="hud__trace" aria-label="traceroute">
            <p className="hud__cmd">
              {dir.id === 'phosphor' ? '$ ' : ''}traceroute to <b>nidas.dev</b> (198.51.100.7), 64 hops max
            </p>
            <ol className="hud__hops">
              {nodes.map((n) => (
                <li key={n.id} className={n.hop === shownHop ? 'is-current' : n.hop < Math.max(shownHop, 0) ? 'is-done' : n.hop > Math.max(shownHop, 0) ? 'is-pending' : ''}>
                  <span className="h-n">{String(n.hop).padStart(2, ' ')}</span>
                  <span className="h-host">{n.host}</span>
                  <span className="h-ms">{n.hop <= Math.max(shownHop, 0) ? n.latency : '…'}</span>
                </li>
              ))}
              <li className="is-denied">
                <span className="h-n"> {firewall.hop}</span>
                <span className="h-host">{firewall.host}</span>
                <span className="h-ms">* * *</span>
              </li>
            </ol>
          </section>

          <section className="hud__stats" aria-label="packet status">
            <div><span>TTL</span><b>{ttl}</b></div>
            <div><span>HOP</span><b>{Math.max(shownHop, 0)}/{nodes.length - 1}</b></div>
            <div><span>RTT</span><b>{latency.replace(' ms', '')}<small>ms</small></b></div>
          </section>

          <Link to="/concepts" className="hud__skip">skip to 2D <span aria-hidden>→</span></Link>

          <nav className="hud__route" aria-label="autopilot">
            <span className="hud__route-label">autopilot</span>
            {nodes.slice(1).map((n) => (
              <button key={n.id} type="button" className={n.hop === shownHop ? 'is-current' : ''}>
                <i>{String(n.hop).padStart(2, '0')}</i>
                {n.label}
              </button>
            ))}
            <button type="button" className="is-locked">
              <i>✕</i>/apps
            </button>
          </nav>

          <p className="hud__keys">
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> drive <span>·</span> <kbd>space</kbd> boost <span>·</span> click a hop to autopilot
          </p>

          <div className="hud__stick" aria-hidden>
            <div className="hud__stick-knob" />
          </div>

          {panelNode === 'about' && (
            <article className="hud__panel" aria-label="About">
              <header>
                <span className="hud__panel-hop">HOP 01 · core-rtr.about · {nodes[1].latency}</span>
                <h1>{ABOUT.title}</h1>
              </header>
              <p className="hud__panel-lead">{ABOUT.lead}</p>
              <p>{ABOUT.body}</p>
              <dl>
                {ABOUT.facts.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <footer>
                <button type="button">next hop: experience →</button>
                <button type="button" className="ghost">close</button>
              </footer>
            </article>
          )}
        </div>
      )}
    </div>
  )
}
