import { certifications, education, profile } from '../../content'
import { T } from './Todo'

export default function AboutBody() {
  return (
    <div className="body body--about">
      <p className="lead">{profile.summary}</p>
      {profile.about.map((p) => (
        <p key={p.slice(0, 24)}>{p}</p>
      ))}
      <dl className="facts">
        <div>
          <dt>role</dt>
          <dd>{profile.role}</dd>
        </div>
        <div>
          <dt>based</dt>
          <dd>
            <T v={profile.location} />
          </dd>
        </div>
        <div>
          <dt>next</dt>
          <dd>{profile.focus}</dd>
        </div>
      </dl>
      <h3>Education</h3>
      <ul className="rows">
        {education.map((e) => (
          <li key={e.id}>
            <span className="rows__main">
              {e.degree} {e.field}
            </span>
            <span className="rows__sub">{e.school}</span>
            <span className="rows__meta">{e.year}</span>
          </li>
        ))}
      </ul>
      <h3>Certifications</h3>
      <ul className="rows">
        {certifications.map((c) => (
          <li key={c.name}>
            <span className="rows__main">{c.name}</span>
            <span className="rows__sub">{c.status}</span>
            <span className="rows__meta">{c.year ?? ''}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
