// Phase 1 research: summary numbers and the shortlist shown on the concept board.
// Thumbnails live in public/concepts/research/<slug>-{desktop,mobile}.webp

export interface Reference {
  slug: string
  name: string
  url: string
  kind: string // what the site is, in a few words
  oneLine: string
  learn: string
  avoid: string
  trust: 'ok' | 'flagged' // flagged = headless WebGL render not trustworthy
  trustNote?: string
  favorite?: boolean
}

export const funnel = [
  { n: '2,100', label: 'entries in developer-portfolios feed.json' },
  { n: '2,054', label: 'alive (HTTP 2xx, not parked or placeholder)' },
  { n: '292', label: 'create a WebGL or WebGPU context at runtime' },
  { n: '150', label: 'highest-signal candidates screenshotted (desktop + mobile)' },
  { n: '15', label: 'shortlisted for Packet, plus the two favorites' },
]

export const method = [
  'Keyword filter on name, URL and tagline (3D, three.js, WebGL, game, driving, explorable, interactive, cyberpunk, creative developer). Only 40 entries matched, because taglines are sparse.',
  'So every live homepage was also loaded in headless Chromium with canvas.getContext() instrumented, which catches 3D sites whose metadata says nothing.',
  'WebGL sites were probed again for three.js (window.__THREE__), canvas coverage of the viewport, draw calls per second, and keyboard listeners (a strong sign of drivable controls). A score from these signals plus keywords picked the top 150.',
  'Each candidate was captured at 1440×900 and at 390×844 (iPhone UA, touch): 298 captures. The headless browser uses software WebGL (SwiftShader). 105 captures ran at 2 fps or less and 14 were blank or still loading (“LOADING 22%”, “SYSTEM BOOT”), so those were not judged on visuals. Shortlisted shots that may misrepresent the site are flagged.',
  'The two favorites and four shortlisted sites got a second pass that clicks through start gates (START, Enter workspace, Animation mode, Enter 3D Racing) and drives or waits longer.',
]

// What the research changes about Packet.
export const takeaways = [
  { title: 'Two doors, one source', text: 'A visible “skip to 2D” in the world and a “see it in 3D” on the 2D page (ohksoehtet, pavithran26, carlos-rojas). Both render from the same src/content files.' },
  { title: 'Autopilot is the main road', text: 'Most visitors will click, not drive. Hop chips, a Places-style list and in-world signage do the navigating (igneczitibor, dorlugasigal, Jesse Zhou). Driving is the bonus.' },
  { title: 'The loader is hop 0', text: 'Loading is the first traceroute line resolving while the packet spawns at the gateway (Bruno’s spawn ring, b-type’s boot voice). The HTML content is already readable underneath.' },
  { title: 'Teach controls once, per device', text: 'One line of hint copy that changes with input (tap vs click vs keys), a visible legend, a joystick on touch, plus “stuck? respawn” and a reset view (Bruno, deepsaha, dorlugasigal).' },
  { title: 'Network voice, used sparingly', text: 'Latency, TTL and hop names give personality (ohksoehtet, praneeth). Keep it in the HUD and labels, and keep panel copy plain English.' },
  { title: 'Never ship an empty DOM', text: 'Panels are real HTML, selectable and crawlable, and mirrored by the 2D page. That is the opposite of a canvas-only shell (Jesse Zhou).' },
  { title: 'Be honest on phones', text: 'Set expectations, use big thumb targets and a lighter effects tier, and make tilt-to-look optional (lin-stephanie, pierre).' },
]

export const favorites: Reference[] = [
  {
    slug: 'bruno-simon',
    name: 'Bruno Simon',
    url: 'https://bruno-simon.com',
    kind: 'drivable 3D world',
    oneLine: 'The benchmark: a small car in a toy world where every section is a place you drive to.',
    learn:
      'The loader is part of the world: a glowing ring fills on the grid, then the car drops in through a spawn portal. One welcome sentence says what to do. Controls are explained per device (keyboard, touch, gamepad). "I’m stuck" respawns you, there is a quality toggle and a map key, achievements reward curiosity, and a behind-the-scenes page credits the stack.',
    avoid:
      'Info sits behind driving skill and physics play. Recruiters can’t skim. Packet needs autopilot and a 2D page that reach the resume in one click. Its look (toy diorama, physics props, the car) is his signature. Take the lessons, not the look.',
    trust: 'flagged',
    trustNote: 'Software WebGL only got through the intro ring and spawn island. The full world never finished streaming, so judge the layout from a real GPU.',
    favorite: true,
  },
  {
    slug: 'jesse-zhou',
    name: 'Jesse Zhou',
    url: 'https://jesse-zhou.com',
    kind: 'baked 3D diorama, click to navigate',
    oneLine: 'Jesse’s Ramen: one dense, beautifully lit shop where a neon signpost is the menu.',
    learn:
      'Navigation lives in the world: signposts labelled projects, articles, about me and credits move the camera to authored viewpoints. No driving skill is needed. That maps directly to Packet’s autopilot chips and node signage. A START gate unlocks audio with consent.',
    avoid:
      'The HTML is a 2.5 KB shell with no text and no noscript, and the DOM stays empty after START. Crawlers, screen readers and no-WebGL visitors get nothing. The black START screen also hides the work until you click.',
    trust: 'ok',
    favorite: true,
  },
]

export const shortlist: Reference[] = [
  {
    slug: 'dorlugasigal',
    name: 'Dor Lugasi-Gal',
    url: 'https://dorlugasigal.netlify.app',
    kind: 'walkable 3D room',
    oneLine: '“The workspace”: a scanned room you walk through, with a Places menu, minimap and key legend.',
    learn:
      'A “Places” list teleports you to points of interest, the same job as autopilot. The minimap, on-screen WASD/space/C/Esc legend and mobile MOVE joystick are all visible from the start. When pointer lock is blocked it says so and falls back to arrow keys.',
    avoid: 'Photoreal scans are heavy, and first-person pointer lock is hostile to casual visitors. Packet stays third-person and stylized.',
    trust: 'ok',
  },
  {
    slug: 'gilitz',
    name: 'Gil Itzhaky',
    url: 'https://gilitz.com',
    kind: '3D resume space game',
    oneLine: 'Pick a ship, then fly between planets that hold parts of the resume.',
    learn:
      'Choosing a vehicle is a quick, fun onboarding that teaches the controls. The HUD has a compass, a “hold space to accelerate” hint, and a “Reset ship” button on mobile.',
    avoid: 'A modal before any content, a scoreboard and destroy-the-fake mechanics: game noise that competes with the resume.',
    trust: 'ok',
  },
  {
    slug: 'carlos-rojas',
    name: 'Carlos Rojas',
    url: 'https://carlos-rojas-portfolio.vercel.app',
    kind: '3D workbench diorama',
    oneLine: 'An electronics bench where each object (pegboard, laptop, oscilloscope) is a section.',
    learn:
      'Hardware objects as section metaphors, close to routers and switches as hops. “View the classic site” is pinned top left, and a bottom chip bar names every object so nobody hunts. “Click anything on the bench” is the only instruction.',
    avoid: 'Dense clutter makes the hit targets small on phones, and the 2D link is small text.',
    trust: 'ok',
  },
  {
    slug: 'igneczitibor',
    name: 'Tibor Ignéczi',
    url: 'https://igneczitibor.hu',
    kind: '3D room with camera stops',
    oneLine: 'An attic study. Intro, About, Projects and Contact chips fly the camera to set views.',
    learn:
      'Section chips as camera stops are exactly Packet’s autopilot chips. Hint text reads “drag or use arrow keys to look around”. It ran at 15–25 fps even in software WebGL, so it’s lean.',
    avoid: 'Content cards float over the scene with weak contrast. Packet panels need a solid backing.',
    trust: 'ok',
  },
  {
    slug: 'ohksoehtet',
    name: 'Ohk Soe Htet',
    url: 'https://www.ohksoehtet.dev',
    kind: '2D site, opt-in 3D mode',
    oneLine: 'A 2D-first portfolio with a “SIMULATION_AVAILABLE · Enter 3D Racing” button.',
    learn:
      'The inverse of skip-to-2D, and proof both directions should exist. The status copy (“UPLINK ESTABLISHED · LAT 0.02ms”, “DIAGNOSTIC_READOUT”) shows how network vocabulary reads as personality.',
    avoid: 'The 3D mode hides in a corner badge, and the system-speak gets heavy in body copy.',
    trust: 'flagged',
    trustNote: 'The 3D racing mode did not finish loading in software WebGL. Only the 2D page was captured.',
  },
  {
    slug: 'pavithran26',
    name: 'Pavithran S',
    url: 'https://pavithran26.net',
    kind: 'mode choice + project orbit',
    oneLine: 'Asks “Animation” or “Professional” up front; animation mode turns projects into an orbit of planets.',
    learn:
      'An explicit fork on arrival respects recruiters without hiding the fun. “Click a planet to explore” is a one-line instruction, and a “Dev terminal” toggle gives power users a side door.',
    avoid: 'Two modes means two sites to maintain. Packet should derive the 2D page from the same content files.',
    trust: 'ok',
  },
  {
    slug: 'p-sushanth',
    name: 'P Sushanth',
    url: 'https://p-sushanth.github.io/Portfolio/',
    kind: 'audience gate',
    oneLine: 'Opens with one question: “Are you a recruiter? YES / NO”.',
    learn: 'Routing by audience is honest and fast. For Packet this becomes a quiet “in a hurry? read the 2D version” link, not a gate.',
    avoid: 'A blocking question as the first screen, with no content behind it for crawlers.',
    trust: 'ok',
  },
  {
    slug: 'ghom',
    name: 'GHOM',
    url: 'https://ghomkrosmonaute.github.io/?game',
    kind: 'cyberpunk game hub',
    oneLine: '“Hub du pilote”: a neon pilot HUD with stats, framing brackets and a hologram planet.',
    learn: 'Cyan/magenta HUD framing, stat counters and corner brackets, a strong reference for direction C’s HUD.',
    avoid: 'Every surface is decorated, so hierarchy collapses. Small French-only text on mobile.',
    trust: 'ok',
  },
  {
    slug: 'praneeth',
    name: 'Praneeth Reddy',
    url: 'https://praneeth-portfolio-silk.vercel.app',
    kind: 'topology hero',
    oneLine: 'A backend engineer whose hero is a live service graph: client, REST API, gRPC, ledger, Postgres.',
    learn: 'Labelled nodes and protocol names make the systems story legible in two seconds. Packet’s node labels and HUD should be that literal.',
    avoid: 'The graph is decoration: you can’t act on it. Packet’s nodes must be the navigation.',
    trust: 'ok',
  },
  {
    slug: 'deepsaha',
    name: 'Deep Saha',
    url: 'https://deepsaha.com',
    kind: '3D journey diorama',
    oneLine: 'A sculpted life diorama with “Tap a model · Drag to orbit” and a Reset view button.',
    learn: 'Device-aware hint copy (tap vs click) and an always-visible reset. Mobile frames the diorama well.',
    avoid: 'Orbiting a single object gets old fast. A route through hops gives Packet a story arc.',
    trust: 'ok',
  },
  {
    slug: 'lin-stephanie',
    name: 'Stephanie Lin',
    url: 'https://lin-stephanie.github.io',
    kind: '3D room with a guide',
    oneLine: 'A playful 3D home where a character’s speech bubbles explain what to do.',
    learn: 'A guide voice in plain sentences. On mobile it says it is “cooler on desktop, but go ahead”: honest expectation-setting.',
    avoid: 'Mascot humor can undercut a professional read. Packet’s guide is the HUD text itself.',
    trust: 'ok',
  },
  {
    slug: 'b-type',
    name: 'Pedro Fabian Owono',
    url: 'https://myportfolio-b-type.onrender.com',
    kind: 'cyber terminal boot',
    oneLine: '“Cyber Portfolio”: a terminal boot, “ACCESS FULL SYSTEMS” and a system-capacity loading bar.',
    learn: 'A loader that speaks in the site’s voice. Packet’s loader can be the first traceroute line resolving.',
    avoid: 'An access gate before any content, a gradient title and a clock/coordinates HUD. These are cyberpunk clichés.',
    trust: 'ok',
  },
  {
    slug: 'thavlik',
    name: 'Thomas Havlik',
    url: 'https://thavlik.dev',
    kind: '3D backdrop + readable copy',
    oneLine: 'A surreal retro desk scene behind a crisp, readable intro and clear CTAs.',
    learn: 'The 3D sets the mood while the real content stays plain HTML on top, and the mobile stack is tidy. A good model for Packet’s 2D page header.',
    avoid: 'The scene is static decoration. It costs GPU time and gives nothing to explore.',
    trust: 'ok',
  },
  {
    slug: 'pierre',
    name: 'Pierre',
    url: 'https://pierre.io',
    kind: 'mobile device motion',
    oneLine: 'Bold 3D rings on desktop; on phones a pill asks “Enable Gyroscope?”.',
    learn: 'Ask for device-motion permission with a clear, optional prompt. That fits Packet’s tilt-to-look idea on phones.',
    avoid: 'Overlapping 3D shapes cover the headline at some sizes.',
    trust: 'ok',
  },
  {
    slug: 'ashlesh',
    name: 'Ashlesh',
    url: 'https://www.ashlesh.co.in',
    kind: 'dark grid + code voice',
    oneLine: 'Closest neighbor to Dark Fiber: a cyan-glow name over a perspective grid, with init_contact() buttons.',
    learn: 'Navy plus cyan with code-voice CTAs reads as engineering at a glance.',
    avoid: 'A perspective grid with glow is a cliché when it means nothing. In Packet the grid has to be the map you travel on.',
    trust: 'ok',
  },
]
