// The three visual directions for the Packet concept.
// Shared by the concept board (swatches, type, notes) and the prototype scene (colors, effects).

export type DirectionId = 'dark-fiber' | 'phosphor' | 'hot-path'

export interface Swatch {
  name: string
  hex: string
  role: string
}

export interface SceneTheme {
  background: string
  fogDensity: number
  // floor
  floorBase: string
  gridMinor: string
  gridMajor: string
  gridStyle: 'lines' | 'dots'
  reflectiveFloor: boolean
  // buildings
  fill: string
  fillTop: string
  edge: string
  edgeOpacity: number
  windows: string[]
  windowDensity: number
  windowStyle: 'strips' | 'panes'
  // network
  link: string
  pulse: string
  ring: string
  packetCore: string
  packetShell: string
  trailHead: string
  trailTail: string
  accent: string
  active: string
  alert: string
  // post
  bloom: { intensity: number; threshold: number; smoothing: number; radius: number }
  vignette: number
  noise: number
  chroma: number
  scanlines: number
  rain: boolean
  camera: { distance: number; height: number; fov: number; lookAhead: number }
}

export interface Direction {
  id: DirectionId
  index: string
  name: string
  tagline: string
  mood: string
  palette: Swatch[]
  type: {
    display: { family: string; css: string; sample: string; note: string; license: string }
    mono: { family: string; css: string; sample: string; note: string; license: string }
  }
  motion: { label: string; text: string }[]
  risks: string[]
  theme: SceneTheme
}

export const directions: Direction[] = [
  {
    id: 'dark-fiber',
    index: 'A',
    name: 'Dark Fiber',
    tagline: 'Cold, precise, quiet. Light only where traffic flows.',
    mood: 'A NOC wallboard at 3am. Deep navy void, buildings drawn by hairline cyan edges, links that carry visible pulses of light. One warm color (amber) reserved for state: the active hop, warnings, the firewall.',
    palette: [
      { name: 'Void', hex: '#04060B', role: 'background, fog' },
      { name: 'Deep', hex: '#0A1424', role: 'building fill, panels' },
      { name: 'Steel', hex: '#1C2B40', role: 'grid, rules, borders' },
      { name: 'Fiber', hex: '#36E2FF', role: 'links, edges, primary glow' },
      { name: 'Signal', hex: '#EAFBFF', role: 'packet core, body text' },
      { name: 'Haze', hex: '#6F8AA6', role: 'secondary text' },
      { name: 'Amber', hex: '#FFB547', role: 'active hop, alerts, firewall' },
    ],
    type: {
      display: {
        family: 'Archivo Expanded',
        css: "'Archivo Variable', sans-serif",
        sample: 'HOP 02 / ABOUT',
        note: 'Archivo at width 125, weight 700: wide engineering-signage caps for hop names and headings.',
        license: 'OFL-1.1',
      },
      mono: {
        family: 'JetBrains Mono',
        css: "'JetBrains Mono', monospace",
        sample: ' 2  core-rtr.about  3.118 ms',
        note: 'Clear, tall x-height, distinct 0/O and 1/l. Carries the traceroute HUD and all data.',
        license: 'OFL-1.1',
      },
    },
    motion: [
      { label: 'Packet handling', text: 'Hovercraft with weight: quick throttle response, gentle drift on turns, auto-centers on links. Feels like riding a rail without being locked to one.' },
      { label: 'Camera follow', text: 'Low chase cam (about 9 m back, 4.5 m up), springs toward a look-ahead point. Slight FOV widening with speed; no roll.' },
      { label: 'Trail', text: 'Thin tapered light ribbon, white at the head and cyan in the tail. Links under the packet brighten as it passes, as if the fiber were lit.' },
      { label: 'Arrival', text: 'The packet enters the node ring and the ring flashes amber. The camera eases into a 3/4 view, then the panel slides in from the right with a hairline wipe. About 600 ms in total.' },
      { label: 'HUD', text: 'Live traceroute in the top left (hop, host, latency), with TTL and hop count in the top right. Hairline rules and no boxes. Text stays crisp and calm.' },
    ],
    risks: ['Can feel austere if the content panels are too sparse.', 'Needs careful bloom tuning so thin edges do not shimmer.'],
    theme: {
      background: '#04060B',
      fogDensity: 0.012,
      floorBase: '#05080F',
      gridMinor: '#13233A',
      gridMajor: '#1F3C5E',
      gridStyle: 'lines',
      reflectiveFloor: false,
      fill: '#070D18',
      fillTop: '#0D1A2E',
      edge: '#36E2FF',
      edgeOpacity: 0.55,
      windows: ['#9FEFFF', '#36E2FF', '#EAFBFF'],
      windowDensity: 0.16,
      windowStyle: 'strips',
      link: '#1A6C86',
      pulse: '#7FF3FF',
      ring: '#36E2FF',
      packetCore: '#FFFFFF',
      packetShell: '#36E2FF',
      trailHead: '#EAFBFF',
      trailTail: '#1BA8D6',
      accent: '#36E2FF',
      active: '#FFB547',
      alert: '#FFB547',
      bloom: { intensity: 0.85, threshold: 0.62, smoothing: 0.25, radius: 0.62 },
      vignette: 0.55,
      noise: 0.035,
      chroma: 0,
      scanlines: 0,
      rain: false,
      camera: { distance: 14, height: 5.4, fov: 50, lookAhead: 10 },
    },
  },
  {
    id: 'phosphor',
    index: 'B',
    name: 'Phosphor',
    tagline: 'A vector world on a green CRT. The console cable, rendered in 3D.',
    mood: 'Everything is drawn in a single phosphor hue: wireframe towers, a dotted ground plane, a beam that leaves afterglow. It reads like a terminal session you can drive through. Heavily stylized and instantly memorable, and closest to how network engineers actually work.',
    palette: [
      { name: 'Tube', hex: '#010502', role: 'background' },
      { name: 'Glass', hex: '#04140A', role: 'panels, fills' },
      { name: 'Dim', hex: '#0F4A22', role: 'grid, inactive lines' },
      { name: 'Phosphor', hex: '#2BD45F', role: 'primary lines, text' },
      { name: 'Bright', hex: '#8CFFAE', role: 'highlights, links' },
      { name: 'Hot', hex: '#E6FFEE', role: 'packet beam, cursor' },
      { name: 'Fault', hex: '#FF4F4F', role: 'ACCESS DENIED only' },
    ],
    type: {
      display: {
        family: 'VT323',
        css: "'VT323', monospace",
        sample: '> HOP 02 ABOUT_',
        note: 'A bitmap-terminal face at large sizes for headings and hop names. Used sparingly: it is display only.',
        license: 'OFL-1.1',
      },
      mono: {
        family: 'IBM Plex Mono',
        css: "'IBM Plex Mono', monospace",
        sample: ' 2  core-rtr.about  3.118 ms',
        note: 'A sober, highly legible mono for body text and data, keeping long reads comfortable under the CRT treatment.',
        license: 'OFL-1.1',
      },
    },
    motion: [
      { label: 'Packet handling', text: 'Snappy and digital: near-instant acceleration and tight turns that snap slightly toward 45° headings. It feels like a cursor with momentum.' },
      { label: 'Camera follow', text: 'Higher and steeper (about 60°), close to a top-down radar view. Smooth damping with no FOV changes, so the vector lines stay stable.' },
      { label: 'Trail', text: 'Phosphor persistence: the beam leaves a long afterglow that decays over about 1.5 s, like a scope trace.' },
      { label: 'Arrival', text: 'Screen tear plus a brief scanline roll, then the panel types itself out character by character with a block cursor. The full text is selectable once done.' },
      { label: 'HUD', text: 'A literal terminal: `$ traceroute nidas.dev` prints hop lines as you travel. Inverse-video highlight on the current hop.' },
    ],
    risks: ['A single hue makes section color-coding harder and can tire the eye.', 'CRT post effects (scanlines, noise) must switch off for reduced motion and low power.', 'Reads as retro, not modern, to some recruiters.'],
    theme: {
      background: '#010502',
      fogDensity: 0.014,
      floorBase: '#010502',
      gridMinor: '#0B3A1B',
      gridMajor: '#1A7A3A',
      gridStyle: 'dots',
      reflectiveFloor: false,
      fill: '#010502',
      fillTop: '#021006',
      edge: '#2BD45F',
      edgeOpacity: 0.95,
      windows: ['#2BD45F', '#8CFFAE'],
      windowDensity: 0.07,
      windowStyle: 'panes',
      link: '#1A7A3A',
      pulse: '#8CFFAE',
      ring: '#2BD45F',
      packetCore: '#E6FFEE',
      packetShell: '#8CFFAE',
      trailHead: '#B8FFCC',
      trailTail: '#2BD45F',
      accent: '#2BD45F',
      active: '#E6FFEE',
      alert: '#FF4F4F',
      bloom: { intensity: 1.0, threshold: 0.5, smoothing: 0.3, radius: 0.6 },
      vignette: 0.85,
      noise: 0.12,
      chroma: 0.0012,
      scanlines: 0.22,
      rain: false,
      camera: { distance: 13, height: 12, fov: 48, lookAhead: 9 },
    },
  },
  {
    id: 'hot-path',
    index: 'C',
    name: 'Hot Path',
    tagline: 'Wet neon streets after rain. Loud, saturated, alive.',
    mood: 'The most literal cyberpunk take: a reflective wet ground, magenta and cyan signage on every node, a violet haze and light rain. Each hop gets its own color, so the route reads like a subway map in neon. High drama and high spectacle.',
    palette: [
      { name: 'Night', hex: '#07040D', role: 'background' },
      { name: 'Plum', hex: '#170B26', role: 'building fill, panels' },
      { name: 'Haze', hex: '#2A1840', role: 'fog, panel borders' },
      { name: 'Magenta', hex: '#FF2D8D', role: 'primary neon, packet' },
      { name: 'Cyan', hex: '#19E6FF', role: 'links, secondary neon' },
      { name: 'Volt', hex: '#C8FF2E', role: 'active hop, CTAs' },
      { name: 'Ultraviolet', hex: '#7B5CFF', role: 'tertiary, depth' },
    ],
    type: {
      display: {
        family: 'Tektur',
        css: "'Tektur Variable', sans-serif",
        sample: 'HOP 02 // ABOUT',
        note: 'Angular, chamfered letterforms that echo cut-corner HUD panels. A variable width axis lets signage go wide.',
        license: 'OFL-1.1',
      },
      mono: {
        family: 'Martian Mono',
        css: "'Martian Mono Variable', monospace",
        sample: ' 2  core-rtr.about  3.118 ms',
        note: 'A wide, technical mono with real character. Set slightly condensed for data so the HUD does not sprawl.',
        license: 'OFL-1.1',
      },
    },
    motion: [
      { label: 'Packet handling', text: 'Arcade: boost on hold, drift with a sideways slide and sparks, a little camera shake on hard turns.' },
      { label: 'Camera follow', text: 'Dynamic chase with an FOV kick on boost and a slight roll into turns. Swoops on arrival.' },
      { label: 'Trail', text: 'Thick magenta-to-cyan ribbon that reflects in the wet floor. Short and punchy.' },
      { label: 'Arrival', text: 'The node signage flickers on in sequence, then the panel slices in with a glitch offset in the hop color.' },
      { label: 'HUD', text: 'Chamfered panels with corner brackets. Each hop is color-coded, with segmented TTL and latency bars.' },
    ],
    risks: ['Reflections and rain are the heaviest GPU load of the three, so mobile and low-power devices need a reduced tier.', 'Closest to the generic cyberpunk look; harder to make feel personal.', 'Saturated text on dark backgrounds needs extra contrast care.'],
    theme: {
      background: '#07040D',
      fogDensity: 0.016,
      floorBase: '#0B0614',
      gridMinor: '#2A1840',
      gridMajor: '#5A2F86',
      gridStyle: 'lines',
      reflectiveFloor: true,
      fill: '#0E0819',
      fillTop: '#1F1033',
      edge: '#FF2D8D',
      edgeOpacity: 0.35,
      windows: ['#FF5FA8', '#5FEFFF', '#FFD0E6'],
      windowDensity: 0.14,
      windowStyle: 'panes',
      link: '#7B5CFF',
      pulse: '#19E6FF',
      ring: '#FF2D8D',
      packetCore: '#FFFFFF',
      packetShell: '#FF2D8D',
      trailHead: '#FF6FB3',
      trailTail: '#19E6FF',
      accent: '#FF2D8D',
      active: '#C8FF2E',
      alert: '#C8FF2E',
      bloom: { intensity: 1.15, threshold: 0.55, smoothing: 0.3, radius: 0.7 },
      vignette: 0.6,
      noise: 0.05,
      chroma: 0.0018,
      scanlines: 0,
      rain: true,
      camera: { distance: 12, height: 4.2, fov: 54, lookAhead: 9 },
    },
  },
]

export const directionById = (id: string | undefined) => directions.find((d) => d.id === id)
