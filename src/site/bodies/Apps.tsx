import { apps } from '../../content'

export default function AppsBody() {
  return (
    <div className="body body--apps">
      <p className="denied" role="status">
        ACCESS DENIED
      </p>
      <pre className="denied__log">{apps.log}</pre>
      <p>{apps.body}</p>
    </div>
  )
}
