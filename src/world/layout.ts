import * as THREE from 'three'
import type { SectionId } from '../site/sections'

// One compact district. Each node is a hop; the packet reaches it by entering its ring.
export type NodeId = 'gateway' | SectionId
export type NodeKind = 'gateway' | 'router' | 'switch' | 'server' | 'ap' | 'firewall'

export interface HopNode {
  id: NodeId
  hop: number
  kind: NodeKind
  pos: [number, number] // x, z
  ring: number // radius of the plaza ring; 0 for the firewall
}

export const PACKET_Y = 1.25

export const nodes: HopNode[] = [
  { id: 'gateway', hop: 0, kind: 'gateway', pos: [0, 44], ring: 5 },
  { id: 'about', hop: 1, kind: 'router', pos: [6, 4], ring: 8 },
  { id: 'experience', hop: 2, kind: 'switch', pos: [36, -22], ring: 8 },
  { id: 'projects', hop: 3, kind: 'server', pos: [14, -70], ring: 8 },
  { id: 'contact', hop: 4, kind: 'ap', pos: [-28, -44], ring: 7 },
  { id: 'apps', hop: 5, kind: 'firewall', pos: [64, -50], ring: 0 },
]
export const nodeById = (id: NodeId) => nodes.find((n) => n.id === id)!
export const plazas = nodes.filter((n) => n.ring > 0)
export const firewall = nodeById('apps')
export const FIREWALL_ROT = -0.9

// Links between hops: a loop plus a dead-end spur to the firewall.
export const edges: [NodeId, NodeId][] = [
  ['gateway', 'about'],
  ['about', 'experience'],
  ['experience', 'projects'],
  ['projects', 'contact'],
  ['contact', 'gateway'],
  ['experience', 'apps'],
]

export interface Link {
  a: NodeId
  b: NodeId
  from: [number, number]
  to: [number, number]
  dead: boolean
}

export const links: Link[] = edges.map(([a, b]) => {
  const A = nodeById(a)
  const B = nodeById(b)
  const dx = B.pos[0] - A.pos[0]
  const dz = B.pos[1] - A.pos[1]
  const len = Math.hypot(dx, dz)
  const ux = dx / len
  const uz = dz / len
  return {
    a,
    b,
    from: [A.pos[0] + ux * A.ring, A.pos[1] + uz * A.ring],
    to: [B.pos[0] - ux * (B.ring || 9), B.pos[1] - uz * (B.ring || 9)],
    dead: b === 'apps',
  }
})

// Where an approach to the firewall stops: on the spur, in front of the wall.
export const firewallApproach = (() => {
  const l = links.find((x) => x.dead)!
  return new THREE.Vector3(l.to[0], PACKET_Y, l.to[1])
})()

// The packet spawns at hop 0, facing the district.
export const SPAWN = new THREE.Vector3(nodes[0].pos[0], PACKET_Y, nodes[0].pos[1])

// Play area. Invisible walls keep the packet inside.
export const BOUNDS = { minX: -96, maxX: 96, minZ: -132, maxZ: 70 }

/** Deterministic PRNG so the district is identical on every visit. */
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function distToSegment(px: number, pz: number, a: [number, number], b: [number, number]) {
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
  solid: boolean // inside the play area, so it gets a collider
}

export function buildCity(seed = 11): Building[] {
  const rnd = mulberry32(seed)
  const out: Building[] = []
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
      for (const n of nodes) if (Math.hypot(x - n.pos[0], z - n.pos[1]) < (n.ring || 8) + 6 + r) clear = false
      for (const l of links) if (distToSegment(x, z, l.from, l.to) < 4.5 + r) clear = false
      if (Math.hypot(x - SPAWN.x, z - SPAWN.z) < 14) clear = false
      if (!clear) continue
      const back = THREE.MathUtils.clamp((-z - 20) / 100, 0, 1)
      const side = THREE.MathUtils.clamp((Math.abs(x) - 30) / 60, 0, 1)
      const base = 3 + rnd() * 9
      const h = base + Math.pow(rnd(), 2) * (10 + 38 * Math.max(back, side))
      out.push({ x, z, w, d, h, solid: true })
    }
  }
  // Far skyline ring, outside the play area.
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + rnd() * 0.05
    const r = 150 + rnd() * 40
    out.push({ x: Math.cos(a) * r, z: Math.sin(a) * r - 30, w: 8 + rnd() * 10, d: 8 + rnd() * 10, h: 25 + rnd() * 60, solid: false })
  }
  return out
}

// ---------- autopilot: route along the links ----------

const adj = new Map<NodeId, { to: NodeId; len: number }[]>()
for (const [a, b] of edges) {
  const A = nodeById(a)
  const B = nodeById(b)
  const len = Math.hypot(A.pos[0] - B.pos[0], A.pos[1] - B.pos[1])
  adj.set(a, [...(adj.get(a) ?? []), { to: b, len }])
  adj.set(b, [...(adj.get(b) ?? []), { to: a, len }])
}

function shortest(from: NodeId, to: NodeId): { path: NodeId[]; len: number } {
  const dist = new Map<NodeId, number>([[from, 0]])
  const prev = new Map<NodeId, NodeId>()
  const open = new Set<NodeId>(nodes.map((n) => n.id))
  while (open.size) {
    let u: NodeId | undefined
    for (const n of open) if (dist.has(n) && (u === undefined || dist.get(n)! < dist.get(u)!)) u = n
    if (u === undefined) break
    open.delete(u)
    if (u === to) break
    for (const e of adj.get(u) ?? []) {
      const alt = dist.get(u)! + e.len
      if (alt < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, alt)
        prev.set(e.to, u)
      }
    }
  }
  const path: NodeId[] = [to]
  while (path[0] !== from && prev.has(path[0])) path.unshift(prev.get(path[0])!)
  return { path, len: dist.get(to) ?? Infinity }
}

const v2 = (n: HopNode) => new THREE.Vector2(n.pos[0], n.pos[1])

/** Point inside a node's ring where the packet stops when it arrives from `from`. */
export function arrivalPoint(id: NodeId, from: THREE.Vector2) {
  const n = nodeById(id)
  if (n.kind === 'firewall') return firewallApproach.clone()
  const c = v2(n)
  const dir = from.clone().sub(c)
  if (dir.lengthSq() < 0.01) dir.set(0, 1)
  dir.normalize().multiplyScalar(n.ring * 0.62)
  return new THREE.Vector3(c.x + dir.x, PACKET_Y, c.y + dir.y)
}

/** Waypoints from the packet's position to a target node, following the links. */
export function planRoute(fromPos: THREE.Vector3, target: NodeId): THREE.Vector3[] {
  const here = new THREE.Vector2(fromPos.x, fromPos.z)
  // Enter the graph at the node that minimises (off-link distance to it + route length from it).
  // Off-link travel is weighted so routes follow the links instead of cutting through blocks.
  let best: { start: NodeId; path: NodeId[]; cost: number } | undefined
  for (const n of nodes) {
    if (n.kind === 'firewall' && target !== 'apps') continue
    const r = shortest(n.id, target)
    const cost = here.distanceTo(v2(n)) * 3 + r.len
    if (!best || cost < best.cost) best = { start: n.id, path: r.path, cost }
  }
  const path = best!.path
  const pts: THREE.Vector3[] = [fromPos.clone().setY(PACKET_Y)]
  for (let i = 0; i < path.length; i++) {
    const n = nodeById(path[i])
    const c = v2(n)
    const isLast = i === path.length - 1
    if (isLast) {
      const prev = i > 0 ? v2(nodeById(path[i - 1])) : here
      pts.push(arrivalPoint(n.id, prev))
      break
    }
    // Skip the entry node when the packet is already inside its ring.
    if (i === 0 && here.distanceTo(c) < n.ring + 1) continue
    // Pass through a plaza on the inside of the turn, clear of the device in the middle.
    const prev = i > 0 ? v2(nodeById(path[i - 1])) : here
    const next = v2(nodeById(path[i + 1]))
    const a = prev.clone().sub(c).normalize()
    const b = next.clone().sub(c).normalize()
    const bis = a.add(b)
    if (bis.lengthSq() < 0.01) bis.set(-b.y, b.x)
    bis.normalize().multiplyScalar(n.ring * 0.72)
    pts.push(new THREE.Vector3(c.x + bis.x, PACKET_Y, c.y + bis.y))
  }
  // Drop near-duplicate points.
  return pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 0.5)
}
