import { Route, Routes, useParams } from 'react-router'
import '@fontsource/vt323/400.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/600.css'
import './site/phosphor.css'
import './site/twod.css'
import './site/bodies/bodies.css'
import Site from './site/Site'
import NotFound from './site/NotFound'
import { isSectionId } from './site/sections'


/**
 * One route for "/", "/2d" and every section, so moving between them never remounts the
 * site (and with it the 3D world).
 */
function SiteRoute() {
  const { section } = useParams()
  if (section === undefined || isSectionId(section)) return <Site />
  if (section === '2d') return <Site force2d />
  return <NotFound />
}

export default function App() {
  return (
    <Routes>
      <Route path="/:section?" element={<SiteRoute />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
