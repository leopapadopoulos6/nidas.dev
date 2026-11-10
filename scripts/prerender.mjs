// Writes static HTML for every site route so phones, crawlers and no-JS visitors get the full
// text content in the first response. Runs after `vite build` (client) and `vite build --ssr`.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = path.resolve('dist')
const ssrEntry = path.resolve('dist-ssr/entry-server.js')
const { render, routes } = await import(pathToFileURL(ssrEntry).href)
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const origin = 'https://nidas.dev'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// Preload the two fonts the first screen uses (latin subsets only).
const assets = fs.readdirSync(path.join(dist, 'assets'))
const preload = ['ibm-plex-mono-latin-400-normal', 'vt323-latin-400-normal']
  .map((stem) => assets.find((f) => f.startsWith(stem) && f.endsWith('.woff2')))
  .filter(Boolean)
  .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`)
  .join('\n    ')
const worldChunk = assets.find((f) => f.startsWith('WorldLayer-') && f.endsWith('.js'))
const head = `${preload}\n    <script>window.__WORLD_CHUNK__ = ${JSON.stringify(worldChunk ? `/assets/${worldChunk}` : '')}</script>`

function page({ url, title, description, body, noindex = false }) {
  let html = template
    .replace('<!--preload-->', head)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(description)}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(title)}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(description)}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${origin}${url}"`)
    .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${origin}${url}"`)
    .replace('<div id="root"></div>', body ? `<div id="root" data-route="${url}">${body}</div>` : '<div id="root"></div>')
  if (noindex) html = html.replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex" />')
  return html
}

function write(file, html) {
  const out = path.join(dist, file)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, html)
  console.log(`prerendered ${file.padEnd(24)} ${(Buffer.byteLength(html) / 1024).toFixed(1)} kB`)
}

for (const r of routes) write(r.file, page({ ...r, body: render(r.url) }))

// 404: Netlify serves dist/404.html for unknown paths.
write('404.html', page({ url: '/404', title: 'Request timed out · nidas.dev', description: 'Page not found.', body: render('/404-not-found'), noindex: true }))

// Client-only shell for the internal design notes (/concepts). Not indexed.
write('concepts/index.html', page({ url: '/concepts', title: 'Packet concept board · nidas.dev', description: 'Internal design notes for nidas.dev v2.', body: '', noindex: true }))

fs.rmSync(path.resolve('dist-ssr'), { recursive: true, force: true })
