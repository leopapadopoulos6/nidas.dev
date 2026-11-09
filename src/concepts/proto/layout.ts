import * as THREE from 'three'

// One compact district. Nodes are "hops"; each sits in a ring (a roundabout the packet circles through).
export type NodeKind = 'gateway' | 'router' | 'switch' | 'server' | 'ap' | 'firewall'

export interface HopNode {
  id: string
  hop: number
  kind: NodeKind
  label: string
  host: string
  latency: string
  pos: [number, number] // x, z
  ring: number
}

export const nodes: HopNode[] = [
  { id: 'gateway', hop: 0, kind: 'gateway', label: 'you', host: 'gw.visitor', latency: '0.412 ms', pos: [0, 44], ring: 5 },
  { id: 'about', hop: 1, kind: 'router', label: 'about', host: 'core-rtr.about', latency: '3.118 ms', pos: [6, 4], ring: 8 },
  { id: 'experience', hop: 2, kind: 'switch', label: 'experience', host: 'dist-sw.exp.nyc', latency: '7.904 ms', pos: [36, -22], ring: 8 },
  { id: 'projects', hop: 3, kind: 'server', label: 'projects', host: 'srv-rack.projects', latency: '12.551 ms', pos: [14, -70], ring: 8 },
  { id: 'contact', hop: 4, kind: 'ap', label: 'contact', host: 'ap.contact.leo', latency: '15.207 ms', pos: [-28, -44], ring: 7 },
]

export const firewall: HopNode = {
  id: 'apps', hop: 5, kind: 'firewall', label: '/apps', host: 'fw.private', latency: '* * *', pos: [64, -50], ring: 0,
}

export const PACKET_Y = 1.25

// Build a closed route that visits each node and circles part of its ring.
export function buildRoute(): THREE.CatmullRomCurve3 {
  const pts: THREE.Vector3[] = []
  const n = nodes.length
  for (let i = 0; i < n; i++) {
    const node = nodes[i]
    const prev = nodes[(i - 1 + n) % n]
    const next = nodes[(i + 1) % n]
    const c = new THREE.Vector2(node.pos[0], node.pos[1])
    const aIn = Math.atan2(prev.pos[1] - c.y, prev.pos[0] - c.x)
    const aOut = Math.atan2(next.pos[1] - c.y, next.pos[0] - c.x)
    // take the short way around the ring, from the entry angle to the exit angle
    let d = aOut - aIn
    while (d > Math.PI) d -= Math.PI * 2
    while (d <= -Math.PI) d += Math.PI * 2
    const steps = Math.max(3, Math.round(Math.abs(d) / 0.45))
    for (let s = 0; s <= steps; s++) {
      const a = aIn + (d * s) / steps
      pts.push(new THREE.Vector3(c.x + Math.cos(a) * node.ring, PACKET_Y, c.y + Math.sin(a) * node.ring))
    }
  }
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5)
}

// Links drawn between node rings (and a dead-end link to the firewall).
export interface Link {
  from: [number, number]
  to: [number, number]
  dead?: boolean
}

export function buildLinks(): Link[] {
  const links: Link[] = []
  const edge = (a: HopNode, b: HopNode, dead = false) => {
    const dx = b.pos[0] - a.pos[0]
    const dz = b.pos[1] - a.pos[1]
    const len = Math.hypot(dx, dz)
    const ux = dx / len
    const uz = dz / len
    links.push({
      from: [a.pos[0] + ux * a.ring, a.pos[1] + uz * a.ring],
      to: [b.pos[0] - ux * (b.ring || 9), b.pos[1] - uz * (b.ring || 9)],
      dead,
    })
  }
  for (let i = 0; i < nodes.length; i++) edge(nodes[i], nodes[(i + 1) % nodes.length])
  edge(nodes[2], firewall, true)
  return links
}

// Deterministic PRNG so every render of the district is identical.
export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function distToSegment(px: number, pz: number, a: [number, number], b: [number, number]) {
  const vx = b[0] - a[0]
  const vz = b[1] - a[1]
  const wx = px - a[0]
  const wz = pz - a[1]
  const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / (vx * vx + vz * vz)))
  return Math.hypot(px - (a[0] + vx * t), pz - (a[1] + vz * t))
}

export interface Building {
  x: number
  z: number
  w: number
  d: number
  h: number
}

export function buildCity(seed = 7): Building[] {
  const rnd = mulberry32(seed)
  const out: Building[] = []
  const links = buildLinks()
  const all = [...nodes, firewall]
  const cell = 9
  for (let gx = -11; gx <= 11; gx++) {
    for (let gz = -16; gz <= 8; gz++) {
      const x = gx * cell + (rnd() - 0.5) * 2
      const z = gz * cell + (rnd() - 0.5) * 2
      if (rnd() < 0.18) continue
      const w = 3 + rnd() * 4.5
      const d = 3 + rnd() * 4.5
      const r = Math.max(w, d) * 0.6
      let clear = true
      for (const n of all) if (Math.hypot(x - n.pos[0], z - n.pos[1]) < (n.ring || 8) + 6 + r) clear = false
      for (const l of links) if (distToSegment(x, z, l.from, l.to) < 4.5 + r) clear = false
      if (!clear) continue
      // taller toward the back and the edges: a skyline that frames the district
      const back = THREE.MathUtils.clamp((-z - 20) / 100, 0, 1)
      const side = THREE.MathUtils.clamp((Math.abs(x) - 30) / 60, 0, 1)
      const base = 3 + rnd() * 9
      const h = base + Math.pow(rnd(), 2) * (10 + 38 * Math.max(back, side))
      out.push({ x, z, w, d, h })
    }
  }
  // far skyline ring
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + rnd() * 0.05
    const r = 150 + rnd() * 40
    out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r - 30, w: 8 + rnd() * 10, d: 8 + rnd() * 10, h: 25 + rnd() * 60 })
  }
  return out
}
