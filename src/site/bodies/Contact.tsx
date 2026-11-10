import { links } from '../../content'
import { T } from './Todo'

export default function ContactBody() {
  return (
    <div className="body body--contact">
      <p className="lead">The last hop. Packets that make it this far get a reply.</p>
      <dl className="facts facts--links">
        {links.map((l) => (
          <div key={l.id}>
            <dt>{l.label}</dt>
            <dd>
              {l.href ? (
                <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer noopener">
                  {l.display}
                </a>
              ) : (
                <T v={l.display} />
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
