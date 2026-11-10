import { experience, skills } from '../../content'
import { T, span } from './Todo'

export default function ExperienceBody() {
  return (
    <div className="body body--experience">
      {experience.map((j) => (
        <article key={j.id} className="job">
          <header>
            <h3>
              {j.title} · <T v={j.org} />
            </h3>
            <p className="job__meta">
              <T v={span(j.start, j.end)} /> · <T v={j.location} />
            </p>
          </header>
          <p>
            <T v={j.summary} />
          </p>
          <ul className="ticks">
            {j.highlights.map((h) => (
              <li key={h}>
                <T v={h} />
              </li>
            ))}
          </ul>
          {j.stack.length > 0 && (
            <ul className="chips" aria-label="Stack">
              {j.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
      <h3>Skills</h3>
      <dl className="skills">
        {skills.map((g) => (
          <div key={g.id}>
            <dt>{g.label}</dt>
            <dd>{g.items.join(' · ')}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
