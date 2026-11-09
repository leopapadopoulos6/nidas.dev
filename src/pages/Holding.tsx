import { Link } from 'react-router'

export default function Holding({ notFound = false }: { notFound?: boolean }) {
  return (
    <main style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 560, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14 }}>
        <p style={{ color: '#6f8aa6', margin: 0 }}>$ traceroute nidas.dev</p>
        {notFound ? (
          <p style={{ color: '#ffb547' }}> *  *  *  request timed out (404)</p>
        ) : (
          <p> 1  leo-papadopoulos (network engineer, NYC)  v2 under construction</p>
        )}
        <p>
          {' '}2  <Link to="/concepts" style={{ color: '#3be8ff' }}>/concepts</Link>  Packet concept board
        </p>
      </div>
    </main>
  )
}
