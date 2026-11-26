# nidas.dev v2 · "Packet"

Leonidas Papadopoulos's portfolio. Visitors steer a data packet through a small network district; each node is a section and the HUD reads like `traceroute`. Visual direction: **B · Phosphor** (single green hue on a dark CRT; red only for ACCESS DENIED). A complete 2D text version ships with every route.

## Stack

Vite + React 19 + TypeScript, React Router, React Three Fiber + drei + @react-three/postprocessing, @react-three/rapier (physics), GSAP (camera/UI transitions), zustand (world state). Fonts are self-hosted via Fontsource (VT323 display, IBM Plex Mono body).

## Commands

- `npm run dev`: dev server (client-rendered; no prerender).
- `npm run build`: client build, SSR build of `src/entry-server.tsx`, then `scripts/prerender.mjs` writes static HTML for every site route into `dist/`.
- `npm run preview`: serve `dist/`.
- `npm run lint`, `npm run typecheck`.

Testing the 3D view in headless Chrome: the boot script sends bots and headless browsers to 2D. Add `?3d` to force 3D and `?fx=crt` or `?fx=lite` to pin the effects tier (software WebGL otherwise drops to lite). `?2d` forces the text version.

## Layout

- `src/content/`: **all copy** (profile, experience, education, skills, links). Components never hardcode copy. Anything Leo still has to confirm contains the string `TODO`; `isTodo()` and the `<T>` helper render it visibly marked.
- `src/site/`: the 2D site and shared pieces. `sections.ts` is the single registry of sections/hops (ids, hop numbers, hosts, titles, descriptions). `bodies/` renders each section; the 2D page and the 3D panels both use them. `Site.tsx` always renders the 2D page (that is what the prerendered HTML contains) and lazy-loads `world/WorldLayer` on top when the boot script chose 3D.
- `src/world/`: the lazy 3D chunk. `layout.ts` (nodes, links, city, autopilot route planning), `District.tsx` (visuals + static colliders), `Packet.tsx` (rapier body, controls, autopilot, hop detection, trail), `CameraRig.tsx`, `Effects.tsx`, `Hud.tsx` + `hud.css`, `store.ts` (zustand), `input.ts`.
- `index.html`: inline boot script (decides 2D vs 3D before first paint) and the static terminal loader (`#boot`).
- `nidas.dev/`: the v1 site. Delete only after `archive/v1` exists on GitHub.

## Conventions

- One route (`/:section?`) serves `/`, `/2d` and every section, so navigation never remounts the world. The open panel *is* the URL: `/about`, `/experience`, `/contact`, `/apps`.
- Phones (≤720 px): arriving at a hop shows a small peek card (title, one-line teaser from `src/site/teaser.ts`, read / next hop) and keeps the joystick and hop buttons usable; driving out of the ring closes it. "read" opens the full sheet (steering pauses; swipe down or "back to steering" returns). Desktop shows the side panel.
- The 2D page must always contain every piece of content. If you add content, add it to `src/content` and render it in a body component; never 3D-only.
- Colors come from the Phosphor tokens (`src/site/phosphor.css`, `src/world/theme.ts`). `--fault` red means ACCESS DENIED and nothing else.
- Build 3D in code (geometry, shaders, postprocessing). Third-party assets and fonts must be CC0, MIT or OFL and logged in `CREDITS.md`. Never copy code, models, textures or distinctive designs from other portfolios.
- Respect `prefers-reduced-motion` (no glitch, roll or typing animations) and keep the 3D chunk out of the initial bundle.
- Accessibility: real text in panels (selectable, crawlable), visible focus, a skip-to-2D control always on screen.

## Definition of done

1. `npm run lint`, `npm run typecheck` and `npm run build` pass.
2. Playwright screenshots at 1440×900 and 390×844 of the 2D page and the 3D view (`?3d&fx=crt`), reviewed against direction B and fixed before pushing. No horizontal scroll at 390 px.
3. New content lives in `src/content` and appears in both the 2D page and the matching 3D panel.
4. Initial JS stays small (the 3D chunk is lazy); check the build output sizes.

## Git

- `main`: production. Netlify builds www.nidas.dev from it. Changes only when Leo asks (normally by merging `concept/packet`).
- `concept/packet`: the v2 working branch. Work here; open PRs into `main`.
- `feature/projects`: the shelved projects section, one commit ("Restore the projects section") on top of `concept/packet`. To bring projects back, rebase it onto the current `concept/packet` and merge it, when Leo asks.
- `archive`: v1 exactly as it was live until the v2 launch (commit c7bad11). Restore v1 with Netlify's "Publish deploy" on deploy `667854289ac5900008cddef3`, or build `archive` with base directory `nidas.dev`, build command `CI=false npm run build`, publish directory `nidas.dev/build` (without `CI=false` the v1 build fails on lint warnings).
- Never push to `main`, merge, or create or delete branches or tags unless Leo asks.
