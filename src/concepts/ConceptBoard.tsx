import { useEffect } from 'react'
import { Link } from 'react-router'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/vt323/400.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource-variable/tektur/wdth.css'
import '@fontsource-variable/martian-mono/wdth.css'
import { directions, type Direction } from './directions'
import { favorites, funnel, method, shortlist, takeaways, type Reference } from './research'
import { firewall, nodes } from './proto/layout'
import './board.css'

function DistrictMap() {
  // top-down schematic of the shared district, drawn from the same layout data the prototype uses
  const all = [...nodes, firewall]
  const xs = all.map((n) => n.pos[0])
  const zs = all.map((n) => n.pos[1])
  const pad = 16
  const minX = Math.min(...xs) - pad
  const maxX = Math.max(...xs) + pad
  const minZ = Math.min(...zs) - pad
  const maxZ = Math.max(...zs) + pad
  const loop = [...nodes, nodes[0]]
  return (
    <svg className="map" viewBox={`${minX} ${minZ} ${maxX - minX} ${maxZ - minZ}`} role="img" aria-label="Top-down map of the district: five hops in a loop and a firewall off hop 2">
      <defs>
        <pattern id="mapgrid" width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M 9 0 L 0 0 0 9" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect x={minX} y={minZ} width={maxX - minX} height={maxZ - minZ} fill="url(#mapgrid)" />
      <polyline points={loop.map((n) => n.pos.join(',')).join(' ')} fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 1.5" />
      <line x1={nodes[2].pos[0]} y1={nodes[2].pos[1]} x2={firewall.pos[0]} y2={firewall.pos[1]} stroke="var(--warn)" strokeWidth="0.8" strokeDasharray="1 1.2" />
      {all.map((n) => (
        <g key={n.id} transform={`translate(${n.pos[0]} ${n.pos[1]})`}>
          {n.kind === 'firewall' ? (
            <rect x="-5" y="-2" width="10" height="4" fill="none" stroke="var(--warn)" strokeWidth="0.8" />
          ) : (
            <circle r={n.ring || 4} fill="var(--bg)" stroke="currentColor" strokeWidth="0.8" />
          )}
          <text y="1.6" textAnchor="middle" fontSize="4.6" fill={n.kind === 'firewall' ? 'var(--warn)' : 'currentColor'}>
            {n.kind === 'firewall' ? '✕' : n.hop}
          </text>
          <text y={n.kind === 'firewall' ? -4.5 : -(n.ring || 4) - 2.5} textAnchor="middle" fontSize="4" className="map__label" fill={n.kind === 'firewall' ? 'var(--warn)' : 'currentColor'}>
            {n.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Still({ src, alt, w, h, className }: { src: string; alt: string; w: number; h: number; className?: string }) {
  return (
    <figure className={`still ${className ?? ''}`}>
      <img src={src} alt={alt} width={w} height={h} loading="lazy" decoding="async" />
    </figure>
  )
}

function DirectionSection({ d }: { d: Direction }) {
  const base = `/concepts/stills/${d.id}`
  return (
    <section id={d.id} className={`dir dir--${d.id}`} aria-labelledby={`${d.id}-title`}>
      <div className="wrap">
        <header className="dir__head">
          <span className="dir__index">{d.index}</span>
          <div>
            <h2 id={`${d.id}-title`} className="dir__name">{d.name}</h2>
            <p className="dir__tagline">{d.tagline}</p>
          </div>
          <Link className="dir__live" to={`/concepts/proto/${d.id}`}>
            open live prototype <span aria-hidden>→</span>
          </Link>
        </header>

        <div className="dir__stills">
          <Still className="still--hero" src={`${base}-hero.webp`} alt={`${d.name}: chase camera approaching hop 3 (projects)`} w={1920} h={1200} />
          <Still className="still--phone" src={`${base}-mobile.webp`} alt={`${d.name} on a phone: joystick, autopilot chips, compact HUD`} w={780} h={1688} />
          <Still className="still--arrival" src={`${base}-arrival.webp`} alt={`${d.name}: arrival at hop 1 (about) with the panel open`} w={1920} h={1200} />
          <Still className="still--phone" src={`${base}-mobile-arrival.webp`} alt={`${d.name} on a phone: arrival panel as a bottom sheet`} w={780} h={1688} />
        </div>
        <p className="dir__caption">
          Rendered from the live prototype in headless Chrome (software WebGL, 2×). Top: cruising toward hop 3. Bottom: arrival at hop 1 with the panel open. Right: the same moments at 390 px.
        </p>

        <p className="dir__mood">{d.mood}</p>

        <div className="dir__grid">
          <div className="dir__block">
            <h3>Palette</h3>
            <ul className="swatches">
              {d.palette.map((s) => (
                <li key={s.hex}>
                  <span className="swatch" style={{ background: s.hex }} />
                  <span className="swatch__name">{s.name}</span>
                  <code>{s.hex}</code>
                  <span className="swatch__role">{s.role}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="dir__block">
            <h3>Type</h3>
            <div className="type">
              <p className="type__sample type__sample--display" style={{ fontFamily: d.type.display.css }}>
                {d.type.display.sample}
              </p>
              <p className="type__meta">
                <b>{d.type.display.family}</b> · display · {d.type.display.license}
              </p>
              <p className="type__note">{d.type.display.note}</p>
              <p className="type__sample type__sample--mono" style={{ fontFamily: d.type.mono.css }}>
                {d.type.mono.sample}
              </p>
              <p className="type__meta">
                <b>{d.type.mono.family}</b> · mono · {d.type.mono.license}
              </p>
              <p className="type__note">{d.type.mono.note}</p>
            </div>
          </div>

          <div className="dir__block dir__block--wide">
            <h3>Motion &amp; feel</h3>
            <dl className="motion">
              {d.motion.map((m) => (
                <div key={m.label}>
                  <dt>{m.label}</dt>
                  <dd>{m.text}</dd>
                </div>
              ))}
            </dl>
            <h3 className="risks__title">Risks</h3>
            <ul className="risks">
              {d.risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function RefCard({ r, big = false }: { r: Reference; big?: boolean }) {
  return (
    <article className={`ref ${big ? 'ref--big' : ''}`}>
      <a className="ref__shots" href={r.url} target="_blank" rel="noreferrer noopener">
        <img className="ref__desk" src={`/concepts/research/${r.slug}-desktop.webp`} alt={`${r.name} at 1440 px`} width={640} height={400} loading="lazy" decoding="async" />
        <img className="ref__phone" src={`/concepts/research/${r.slug}-mobile.webp`} alt={`${r.name} at 390 px`} width={180} height={390} loading="lazy" decoding="async" />
        {r.trust === 'flagged' && (
          <span className="ref__flag" title={r.trustNote}>
            ⚠ headless render
          </span>
        )}
      </a>
      <div className="ref__body">
        <h4>
          <a href={r.url} target="_blank" rel="noreferrer noopener">
            {r.name}
          </a>
        </h4>
        <p className="ref__kind">
          {r.kind} · <span>{r.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
        </p>
        <p className="ref__line">{r.oneLine}</p>
        <p className="ref__learn">
          <b>Learn</b> {r.learn}
        </p>
        <p className="ref__avoid">
          <b>Avoid</b> {r.avoid}
        </p>
        {r.trust === 'flagged' && r.trustNote && <p className="ref__trust">{r.trustNote}</p>}
      </div>
    </article>
  )
}

export default function ConceptBoard() {
  useEffect(() => {
    document.title = 'Packet · concept board · nidas.dev'
  }, [])
  return (
    <div className="board">
      <header className="top wrap">
        <p className="eyebrow">
          <Link to="/">nidas.dev</Link> / concepts · phase 2 · <span className="status">picked: B · Phosphor (phase 3 in progress)</span>
        </p>
        <h1>Packet</h1>
        <p className="lead">
          An explorable network district. You steer a glowing data packet hop by hop through routers, switches and servers. Each hop is a section of the site, so touring it reads like a traceroute. Below are three visual directions for the same small district, the research behind them, and my recommendation.
        </p>
        <nav className="toc" aria-label="On this page">
          {directions.map((d) => (
            <a key={d.id} href={`#${d.id}`}>
              <i>{d.index}</i> {d.name}
            </a>
          ))}
          <a href="#research">
            <i>R</i> Research
          </a>
          <a href="#pick">
            <i>→</i> Recommendation
          </a>
        </nav>
        <div className="tldr">
          <p>
            <b>Picked by Leo: B · Phosphor.</b> (My recommendation was A · Dark Fiber; the reasoning is kept below for the record.) <a href="#pick">Why ↓</a>
          </p>
        </div>
      </header>

      <section className="shared wrap" aria-labelledby="shared-title">
        <div className="shared__text">
          <h2 id="shared-title">What stays the same in every direction</h2>
          <ul>
            <li>
              <b>One compact district</b> with five hops in a loop: <code>0 you</code> → <code>1 about</code> (core router) → <code>2 experience</code> (switch stack) → <code>3 projects</code> (server racks) → <code>4 contact</code> (access point). A dead-end link runs from hop 2 to the <code>/apps</code> firewall: ACCESS DENIED.
            </li>
            <li>
              <b>Nodes are ring plazas.</b> The packet enters a ring, slows, and the panel opens. Rings make arrival readable from any angle and give drivers a forgiving target.
            </li>
            <li>
              <b>Three ways to move:</b> WASD/arrows, a touch joystick, and autopilot chips (click a hop and the packet routes itself there). <b>skip to 2D</b> is pinned in every HUD.
            </li>
            <li>
              <b>HUD = traceroute.</b> Hop list with host and latency, plus TTL counting down as you go deeper. Panels hold real text: selectable, crawlable, and mirrored by the 2D site.
            </li>
            <li>
              <b>Built in code:</b> instanced buildings with shader-drawn edges and windows, link pulses, an arc-length trail, fog and bloom. No downloaded models so far.
            </li>
          </ul>
        </div>
        <figure className="shared__map">
          <DistrictMap />
          <figcaption>District map, drawn from the prototype&rsquo;s layout data. Grid squares are 9 m; the whole loop is about 300 m.</figcaption>
        </figure>
      </section>

      {directions.map((d) => (
        <DirectionSection key={d.id} d={d} />
      ))}

      <section id="research" className="research" aria-labelledby="research-title">
        <div className="wrap">
          <h2 id="research-title">Research</h2>
          <p className="lead">
            I mined <a href="https://github.com/emmabostian/developer-portfolios" target="_blank" rel="noreferrer noopener">emmabostian/developer-portfolios</a> for 3D and interactive portfolios, then looked closely at your two favorites.
          </p>
          <ol className="funnel">
            {funnel.map((f) => (
              <li key={f.label}>
                <b>{f.n}</b>
                <span>{f.label}</span>
              </li>
            ))}
          </ol>
          <details className="method">
            <summary>How the filter worked</summary>
            <ul>
              {method.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </details>

          <h3 className="research__sub">Your favorites</h3>
          <div className="refs refs--fav">
            {favorites.map((r) => (
              <RefCard key={r.slug} r={r} big />
            ))}
          </div>

          <h3 className="research__sub">Shortlist · {shortlist.length} most relevant to Packet</h3>
          <div className="refs">
            {shortlist.map((r) => (
              <RefCard key={r.slug} r={r} />
            ))}
          </div>

          <h3 className="research__sub">What this changes about Packet</h3>
          <ol className="takeaways">
            {takeaways.map((t) => (
              <li key={t.title}>
                <b>{t.title}</b>
                <span>{t.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pick" className="pick wrap" aria-labelledby="pick-title">
        <h2 id="pick-title">Recommendation: A · Dark Fiber</h2>
        <div className="pick__cols">
          <div>
            <h3>Why</h3>
            <ul>
              <li>
                <b>It reads as an engineer&rsquo;s site, not a game jam.</b> Restraint signals precision. The only things that glow are the things that carry traffic, which is the story of your job. Recruiters get calm, legible panels; the spectacle stays in the world.
              </li>
              <li>
                <b>Color carries meaning.</b> Cyan is normal traffic and amber is state (the active hop, warnings, the firewall). That gives the HUD and the 2D site a built-in status language, the way a NOC dashboard works.
              </li>
              <li>
                <b>Cheapest to run well.</b> No reflections, no rain, and unlit shader materials. It is the direction most likely to hold 60 fps on a mid-range laptop and still look right on the reduced mobile tier.
              </li>
              <li>
                <b>It ages well and scales to /apps.</b> The same hairline UI suits private dashboards later. Phosphor or Hot Path would fight data-dense screens.
              </li>
              <li>
                <b>It is the most yours.</b> Hot Path is the default cyberpunk look many 3D portfolios already use. Dark Fiber is more specific: fiber, pulses, traceroute.
              </li>
            </ul>
          </div>
          <div>
            <h3>What I would borrow</h3>
            <ul>
              <li>
                <b>From Phosphor:</b> the terminal voice. <code>$ traceroute nidas.dev</code>, typed-out arrival text and inverse-video highlights, kept to HUD copy only. Also a hidden <i>CRT mode</i> easter egg.
              </li>
              <li>
                <b>From Hot Path:</b> per-hop accent tints on the node signage (still within the cyan/amber system), and a subtle wet sheen on the ring plazas only, not the whole floor.
              </li>
            </ul>
            <h3>Decisions I need from you</h3>
            <ol>
              <li>Pick a direction (A, B, C, or a mix, in words).</li>
              <li>
                <code>archive/v1</code> does not exist on GitHub yet; only <code>main</code> and <code>dev</code> hold v1. Create it before I delete <code>nidas.dev/</code> in Phase 3 (I won&rsquo;t create branches).
              </li>
              <li>
                Netlify built no deploy preview for this PR (no status checks; old PRs had none either). Deploy previews may be off for the <code>nidas</code> site: Site configuration → Build &amp; deploy → Branches and deploy contexts → Deploy previews.
              </li>
            </ol>
          </div>
        </div>
      </section>

      <footer className="foot wrap">
        <p>
          Fonts (all OFL-1.1, self-hosted via Fontsource): Archivo, JetBrains Mono, VT323, IBM Plex Mono, Tektur, Martian Mono. Screenshots of third-party sites are for internal research only and link to the originals. No code or assets were taken from them.
        </p>
      </footer>
    </div>
  )
}
