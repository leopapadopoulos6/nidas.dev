import { projects } from '../../content'
import { T } from './Todo'

export default function ProjectsBody() {
  return (
    <div className="body body--projects">
      <p className="lead">A short list on purpose. The site you are on is the main exhibit.</p>
      {projects.map((p) => (
        <article key={p.id} className="project">
          <h3>
            {p.name} <span className="project__status">[{p.status}]</span>
          </h3>
          <p>
            <T v={p.summary} />
          </p>
          <p className="project__meta">
            role: <T v={p.role} />
            {p.stack.length > 0 && <> · {p.stack.join(', ')}</>}
          </p>
          {p.links.length > 0 ? (
            <p className="project__links">
              {p.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer noopener">
                  {l.label} ↗
                </a>
              ))}
            </p>
          ) : (
            <p className="project__links">
              <span className="todo">links: TODO</span>
            </p>
          )}
        </article>
      ))}
    </div>
  )
}
