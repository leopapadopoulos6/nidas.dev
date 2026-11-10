import { Link } from 'react-router'
import { profile } from '../content'
import { bodies } from './bodies'
import { publicSections, sections, type SectionId } from './sections'

interface Props {
  active?: SectionId
  hidden?: boolean
  notice?: string
  onEnter3d?: () => void
}

// Fixed, made-up latencies: they only decorate the traceroute-style index.
const rtt: Record<SectionId, string> = { about: '3.118 ms', experience: '7.904 ms', projects: '12.551 ms', contact: '15.207 ms', apps: '* * *' }

/** The complete text version of the site. Prerendered into every route's HTML. */
export default function TwoD({ active, hidden, notice, onEnter3d }: Props) {
  return (
    <div className="tw" hidden={hidden} data-active={active}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="tw__top">
        <p className="tw__prompt" aria-hidden="true">
          $ traceroute nidas.dev
        </p>
        <h1 className="tw__name">{profile.name}</h1>
        <p className="tw__role">
          {profile.role} · {profile.location.includes('TODO') ? 'New York City' : profile.location}
        </p>
        <p className="tw__summary">{profile.summary}</p>

        <nav className="tw__route" aria-label="Sections">
          <p className="tw__route-head" aria-hidden="true">
            traceroute to nidas.dev (198.51.100.7), 64 hops max
          </p>
          <ol>
            <li aria-hidden="true">
              <span className="n"> 0</span>
              <span className="h">gw.visitor</span>
              <span className="l">you</span>
              <span className="ms">0.412 ms</span>
            </li>
            {sections.map((s) => (
              <li key={s.id} className={`${s.id === active ? 'is-active' : ''} ${s.id === 'apps' ? 'is-denied' : ''}`}>
                <span className="n" aria-hidden="true">
                  {String(s.hop).padStart(2, ' ')}
                </span>
                <span className="h" aria-hidden="true">
                  {s.host}
                </span>
                <a className="l" href={`#${s.id}`}>
                  {s.label}
                </a>
                <span className="ms" aria-hidden="true">
                  {rtt[s.id]}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        <div className="tw__actions">
          <button type="button" className="tw__enter3d" onClick={onEnter3d}>
            enter the 3D district →
          </button>
          <span className="tw__hint">An explorable version of this page. Best on a desktop browser.</span>
        </div>
        {notice && (
          <p className="tw__notice" role="status">
            {notice}
          </p>
        )}
      </header>

      <main id="main" className="tw__main">
        {sections.map((s) => {
          const Body = bodies[s.id]
          return (
            <section key={s.id} id={s.id} className={`tw__section tw__section--${s.id}`} aria-labelledby={`${s.id}-h`}>
              <header className="tw__section-head">
                <span className="tw__hop">
                  hop {String(s.hop).padStart(2, '0')} · {s.host}
                </span>
                <h2 id={`${s.id}-h`}>{s.id === 'apps' ? '/apps' : s.label}</h2>
              </header>
              <Body />
            </section>
          )
        })}
      </main>

      <footer className="tw__foot">
        <p>
          {publicSections.map((s, i) => (
            <span key={s.id}>
              {i > 0 && ' · '}
              <a href={`#${s.id}`}>{s.label}</a>
            </span>
          ))}
        </p>
        <p>
          © {profile.name} · {profile.site} · <Link to="/concepts">design notes</Link>
        </p>
      </footer>
    </div>
  )
}
