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

// Placeholder panel copy for the prototype (seeded from Leo's notes; TODO items stay TODO).
const PANELS: Record<string, { title: string; lead: string; body: string; facts: [string, string][] }> = {
  about: {
    title: 'About',
    lead: 'Network engineer in New York. I design, cable, and keep alive the networks small companies run on.',
    body: 'Client site engineering at Promenet: VLANs and trunking, HA/failover, firewall migrations, wireless surveys, and structured cabling. Working toward CCNA and moving toward security.',
    facts: [
      ['role', 'Network Engineer, Promenet, Inc.'],
      ['based', 'NYC'],
      ['since', '2024'],
      ['next', 'CCNA → security'],
    ],
  },
  experience: {
    title: 'Experience',
    lead: 'Network Engineer at Promenet, Inc. (NYC), 2024 to present.',
    body: 'Client site engineering across VLANs, trunking, HA/failover, firewall migrations, wireless surveys and structured cabling, plus SaaS administration and client documentation.',
    facts: [
      ['net', 'Cisco ASA · Catalyst · Nexus · Meraki'],
      ['wifi', 'Aruba · Ruckus/Brocade'],
      ['saas', 'Okta · Entra ID/Intune · M365'],
      ['prior', 'Systems Administrator (TODO)'],
    ],
  },
  projects: {
    title: 'Projects',
    lead: 'A short list on purpose. The site itself is the main exhibit.',
    body: 'Descriptions and links are TODO until Leo fills them in.',
    facts: [
      ['01', 'ProfessorPilot (TODO)'],
      ['02', 'TrackMyDiet (TODO)'],
      ['03', 'nidas.dev v2: this world'],
    ],
  },
  contact: {
    title: 'Contact',
    lead: 'The last hop. Packets that reach this far get a reply.',
    body: 'Email is the fastest route. LinkedIn is TODO.',
    facts: [
      ['email', 'leo@nidas.dev'],
      ['github', 'github.com/leopapadopoulos6'],
      ['linkedin', 'TODO'],
    ],
  },
}

export default function Prototype() {
  const { direction } = useParams()
  const [sp] = useSearchParams()
  const dir = directionById(direction) ?? directions[0]
  const fixedU = sp.has('u') ? Number(sp.get('u')) : undefined
  const fixedT = sp.has('t') ? Number(sp.get('t')) : undefined
  const stillPanel = sp.get('panel') ?? undefined
  const showHud = sp.get('hud') !== '0'
  const hi = sp.get('hq') === '1'
  const isStill = fixedU !== undefined
  const [hop, setHop] = useState(-1)
  const [target, setTarget] = useState<string | undefined>(undefined)
  const [open, setOpen] = useState<string | undefined>(undefined)
  const panelNode = isStill ? stillPanel : open
  const fly = (id: string) => {
    setOpen(undefined)
    setTarget(id)
  }
  const close = () => {
    setOpen(undefined)
    setTarget(undefined)
  }
  const panel = panelNode ? PANELS[panelNode] : undefined
  const panelHop = nodes.find((n) => n.id === panelNode)
  const nextNode = panelHop ? nodes[panelHop.hop + 1] : undefined
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
          <World
            key={dir.id}
            theme={dir.theme}
            directionId={dir.id}
            fixedU={fixedU}
            fixedT={fixedT}
            panelNode={panelNode}
            onHop={setHop}
            hiQuality={hi}
            autopilotTo={target}
            onArrive={setOpen}
          />
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
              <button key={n.id} type="button" className={n.hop === shownHop ? 'is-current' : ''} onClick={() => fly(n.id)} aria-label={`Autopilot to hop ${n.hop}, ${n.label}`}>
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

          {panel && panelHop && (
            <article className="hud__panel" aria-label={panel.title}>
              <header>
                <span className="hud__panel-hop">
                  HOP {String(panelHop.hop).padStart(2, '0')} · {panelHop.host} · {panelHop.latency}
                </span>
                <h1>{panel.title}</h1>
              </header>
              <p className="hud__panel-lead">{panel.lead}</p>
              <p>{panel.body}</p>
              <dl>
                {panel.facts.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <footer>
                {nextNode ? (
                  <button type="button" onClick={() => fly(nextNode.id)}>
                    next hop: {nextNode.label} →
                  </button>
                ) : (
                  <button type="button" onClick={() => fly('about')}>
                    back to hop 1 →
                  </button>
                )}
                <button type="button" className="ghost" onClick={close}>
                  close
                </button>
              </footer>
            </article>
          )}

          {!isStill && (
            <p className="hud__badge">
              prototype · auto-tour runs on its own · click a hop to fly there · WASD driving arrives in phase 3
            </p>
          )}
        </div>
      )}
    </div>
  )
}
