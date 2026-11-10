import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router'
import App from './App'
import { home, sections } from './site/sections'

export function render(url: string) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
}

/** Routes written to dist as static HTML, with their head metadata. */
export const routes = [
  { url: '/', file: 'index.html', title: home.title, description: home.description },
  { url: '/2d', file: '2d/index.html', title: `Text version · ${home.title}`, description: home.description },
  ...sections.map((s) => ({ url: `/${s.id}`, file: `${s.id}/index.html`, title: s.title, description: s.description })),
]
