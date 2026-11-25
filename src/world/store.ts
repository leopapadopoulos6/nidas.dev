import { create } from 'zustand'
import * as THREE from 'three'
import type { SectionId } from '../site/sections'
import { SPAWN, type NodeId } from './layout'

export type Quality = 'high' | 'low'

interface WorldState {
  ready: boolean
  quality: Quality
  /** node whose ring the packet is inside */
  current: NodeId | null
  /** open arrival panel */
  panel: SectionId | null
  /** node ids in the order first reached (traceroute order) */
  visited: NodeId[]
  /** RTT (ms) recorded when each node was first reached */
  rtt: Partial<Record<NodeId, number>>
  autopilot: NodeId | null
  /** bumps on every arrival / denial so effects can react */
  arrivals: number
  denials: number
  respawns: number
  moved: boolean
  touch: boolean

  setReady: () => void
  setQuality: (q: Quality) => void
  setTouch: (t: boolean) => void
  markMoved: () => void
  enter: (id: NodeId, rtt: number) => void
  leave: (id: NodeId) => void
  openPanel: (id: SectionId) => void
  closePanel: () => void
  goTo: (id: NodeId) => void
  stopAutopilot: () => void
  deny: (rtt: number) => void
  respawn: () => void
}

export const useWorld = create<WorldState>((set, get) => ({
  ready: false,
  quality: 'high',
  current: null,
  panel: null,
  visited: ['gateway'],
  rtt: { gateway: 0.412 },
  autopilot: null,
  arrivals: 0,
  denials: 0,
  respawns: 0,
  moved: false,
  touch: false,

  setReady: () => set({ ready: true }),
  setQuality: (quality) => set({ quality }),
  setTouch: (touch) => set({ touch }),
  markMoved: () => (get().moved ? undefined : set({ moved: true })),
  enter: (id, rtt) => {
    const s = get()
    const first = !s.visited.includes(id)
    set({
      current: id,
      visited: first ? [...s.visited, id] : s.visited,
      rtt: first ? { ...s.rtt, [id]: rtt } : s.rtt,
    })
  },
  leave: (id) => {
    const s = get()
    if (s.current !== id) return
    set({ current: null, panel: s.panel === id ? null : s.panel })
  },
  openPanel: (id) => set((s) => ({ panel: id, arrivals: s.arrivals + 1 })),
  closePanel: () => set({ panel: null }),
  goTo: (id) => set({ autopilot: id, panel: null, moved: true }),
  stopAutopilot: () => set({ autopilot: null }),
  deny: (rtt) =>
    set((s) => ({
      denials: s.denials + 1,
      panel: 'apps',
      current: 'apps',
      visited: s.visited.includes('apps') ? s.visited : [...s.visited, 'apps'],
      rtt: s.rtt.apps ? s.rtt : { ...s.rtt, apps: rtt },
    })),
  respawn: () => set((s) => ({ respawns: s.respawns + 1, autopilot: null, panel: null, current: null })),
}))

/** Per-frame packet telemetry. Mutable on purpose: read in render loops, never in React render. */
export const packet = {
  pos: SPAWN.clone(),
  vel: new THREE.Vector3(),
  heading: Math.PI, // facing -Z
  distance: 0, // meters travelled, drives the RTT readout
}

export const rttFromDistance = (m: number) => 0.412 + m * 0.045
