import { useEffect } from 'react'
import { Link } from 'react-router'

export default function NotFound() {
  useEffect(() => {
    document.title = 'Request timed out · nidas.dev'
  }, [])
  return (
    <main className="tw tw--404">
      <p className="tw__prompt">$ traceroute nidas.dev{typeof location === 'undefined' ? '' : location.pathname}</p>
      <h1 className="tw__name">* * *</h1>
      <p className="tw__summary">Request timed out. That path doesn’t exist on this network.</p>
      <p>
        <Link to="/">Back to hop 0</Link> · <Link to="/2d">text version</Link>
      </p>
    </main>
  )
}
