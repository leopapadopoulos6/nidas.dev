import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BallCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import gsap from 'gsap'
import * as THREE from 'three'
import { hasInput, input, updateFromKeys } from './input'
import { PACKET_Y, SPAWN, distToSegment, firewall, nodeById, plazas, planRoute, type NodeId } from './layout'
import * as S from './shaders'
import { packet, rttFromDistance, useWorld } from './store'
import { DRIVE, theme } from './theme'

// Rapier body types (see @dimforge/rapier3d-compat RigidBodyType).
const DYNAMIC = 0
const KINEMATIC_POSITION = 2

const c = (hex: string, k = 1) => new THREE.Color(hex).multiplyScalar(k)
const SNAP = (DRIVE.snapDeg * Math.PI) / 180

/** Pull a direction toward the nearest 45° heading when it is close: the "digital" feel. */
function snap45(x: number, z: number) {
  const a = Math.atan2(z, x)
  const n = Math.round(a / (Math.PI / 4)) * (Math.PI / 4)
  if (Math.abs(a - n) < SNAP) {
    const l = Math.hypot(x, z)
    return [Math.cos(n) * l, Math.sin(n) * l] as const
  }
  return [x, z] as const
}

const TRAIL_SEG = 64
const TRAIL_RAD = 6

function useHalo() {
  return useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 128
    const g = cv.getContext('2d')!
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grd.addColorStop(0, 'rgba(255,255,255,1)')
    grd.addColorStop(0.25, 'rgba(255,255,255,0.35)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, 128, 128)
    const t = new THREE.CanvasTexture(cv)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

/** Phosphor persistence: the last 1.5 s of positions, drawn as a tapering tube that decays. */
function Trail() {
  const history = useRef<{ t: number; x: number; z: number }[]>([])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const verts = (TRAIL_SEG + 1) * TRAIL_RAD
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts * 3), 3))
    const at = new Float32Array(verts)
    for (let i = 0; i <= TRAIL_SEG; i++) for (let j = 0; j < TRAIL_RAD; j++) at[i * TRAIL_RAD + j] = 1 - i / TRAIL_SEG
    g.setAttribute('aT', new THREE.BufferAttribute(at, 1))
    const idx: number[] = []
    for (let i = 0; i < TRAIL_SEG; i++)
      for (let j = 0; j < TRAIL_RAD; j++) {
        const a = i * TRAIL_RAD + j
        const b = i * TRAIL_RAD + ((j + 1) % TRAIL_RAD)
        const d = (i + 1) * TRAIL_RAD + j
        const e = (i + 1) * TRAIL_RAD + ((j + 1) % TRAIL_RAD)
        idx.push(a, d, b, b, d, e)
      }
    g.setIndex(idx)
    return g
  }, [])
  const uniforms = useMemo(
    () => THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uHead: { value: c(theme.trailHead, 1.4) }, uTail: { value: c(theme.trailTail, 1.1) }, uOpacity: { value: 0.9 } }]),
    [],
  )
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), q: new THREE.Vector3(), t: new THREE.Vector3(), s: new THREE.Vector3(), u: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }), [])
  useFrame((state) => {
    const now = state.clock.elapsedTime
    const h = history.current
    const last = h[h.length - 1]
    if (!last || Math.hypot(last.x - packet.pos.x, last.z - packet.pos.z) > 0.02 || now - last.t > 0.05) h.push({ t: now, x: packet.pos.x, z: packet.pos.z })
    while (h.length > 2 && h[1].t < now - DRIVE.trailSeconds) h.shift()
    const sample = (t: number, out: THREE.Vector3) => {
      if (t >= h[h.length - 1].t) return out.set(h[h.length - 1].x, PACKET_Y, h[h.length - 1].z)
      if (t <= h[0].t) return out.set(h[0].x, PACKET_Y, h[0].z)
      let lo = 0
      let hi = h.length - 1
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (h[mid].t < t) lo = mid
        else hi = mid
      }
      const k = (t - h[lo].t) / (h[hi].t - h[lo].t || 1)
      return out.set(h[lo].x + (h[hi].x - h[lo].x) * k, PACKET_Y, h[lo].z + (h[hi].z - h[lo].z) * k)
    }
    const arr = geo.attributes.position.array as Float32Array
    for (let i = 0; i <= TRAIL_SEG; i++) {
      const k = i / TRAIL_SEG
      sample(now - k * DRIVE.trailSeconds, tmp.p)
      sample(now - k * DRIVE.trailSeconds + 0.02, tmp.q)
      tmp.t.subVectors(tmp.q, tmp.p)
      if (tmp.t.lengthSq() < 1e-8) tmp.t.set(0, 0, -1)
      tmp.t.normalize()
      tmp.s.crossVectors(tmp.t, tmp.up).normalize()
      tmp.u.crossVectors(tmp.s, tmp.t).normalize()
      const r = 0.2 * Math.pow(1 - k, 0.6)
      for (let j = 0; j < TRAIL_RAD; j++) {
        const a = (j / TRAIL_RAD) * Math.PI * 2
        const o = (i * TRAIL_RAD + j) * 3
        arr[o] = tmp.p.x + (tmp.s.x * Math.cos(a) + tmp.u.x * Math.sin(a)) * r
        arr[o + 1] = tmp.p.y + (tmp.s.y * Math.cos(a) + tmp.u.y * Math.sin(a)) * r * 0.6
        arr[o + 2] = tmp.p.z + (tmp.s.z * Math.cos(a) + tmp.u.z * Math.sin(a)) * r
      }
    }
    geo.attributes.position.needsUpdate = true
  })
  return (
    <mesh geometry={geo} frustumCulled={false} raycast={() => null}>
      <shaderMaterial vertexShader={S.trailVert} fragmentShader={S.trailFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog />
    </mesh>
  )
}

interface Props {
  onArrive: (id: NodeId) => void
  onDeny: () => void
}

export default function Packet({ onArrive, onDeny }: Props) {
  const body = useRef<RapierRigidBody>(null)
  const visual = useRef<THREE.Group>(null)
  const shell = useRef<THREE.Mesh>(null)
  const halo = useHalo()
  const autopilot = useWorld((s) => s.autopilot)
  const respawns = useWorld((s) => s.respawns)
  const route = useRef<{ curve: THREE.CatmullRomCurve3; s: { t: number }; target: NodeId; tween: gsap.core.Tween } | null>(null)
  const prev = useMemo(() => new THREE.Vector3().copy(SPAWN), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  const toDynamic = () => {
    const b = body.current
    if (!b) return
    b.setBodyType(DYNAMIC, true)
    b.setLinvel({ x: 0, y: 0, z: 0 }, true)
  }

  /**
   * Check the segment travelled since last frame against every ring, so fast moves and slow
   * frames never skip a hop. On autopilot, passing hops are only logged; driving in by hand
   * opens the panel.
   */
  const sweep = (from: THREE.Vector3, to: THREE.Vector3, auto: boolean) => {
    const world = useWorld.getState()
    const a: [number, number] = [from.x, from.z]
    const b: [number, number] = [to.x, to.z]
    const hits = plazas
      .filter((n) => world.current !== n.id && distToSegment(n.pos[0], n.pos[1], a, b) < n.ring - 0.4)
      .sort((p, q) => Math.hypot(p.pos[0] - a[0], p.pos[1] - a[1]) - Math.hypot(q.pos[0] - a[0], q.pos[1] - a[1]))
    for (const n of hits) {
      useWorld.getState().enter(n.id, rttFromDistance(packet.distance))
      const endsInside = Math.hypot(to.x - n.pos[0], to.z - n.pos[1]) < n.ring - 0.4
      if (!auto && endsInside && n.kind !== 'gateway') onArrive(n.id)
    }
  }

  // Start / stop autopilot runs.
  useEffect(() => {
    const b = body.current
    if (!b) return
    route.current?.tween.kill()
    route.current = null
    if (!autopilot) {
      if (b.bodyType() !== DYNAMIC) toDynamic()
      return
    }
    const pts = planRoute(packet.pos, autopilot)
    if (pts.length < 2) pts.push(pts[0].clone().add(new THREE.Vector3(0, 0, -0.01)))
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5)
    const len = curve.getLength()
    b.setBodyType(KINEMATIC_POSITION, true)
    const s = { t: 0 }
    const target = autopilot
    const tween = gsap.to(s, {
      t: 1,
      duration: Math.max(0.9, len / DRIVE.autopilotSpeed + 0.6),
      ease: 'power2.inOut',
      onComplete: () => {
        route.current = null
        // Land exactly on the end of the route (slow frames can lag the tween), logging any
        // hops crossed on the way.
        const end = curve.getPointAt(1)
        sweep(packet.pos, end, true)
        b.setTranslation(end, true)
        packet.pos.copy(end)
        prev.copy(end)
        if (target === 'apps') {
          // Knock on the firewall, get bounced.
          const wall = new THREE.Vector3(firewall.pos[0], PACKET_Y, firewall.pos[1])
          const from = end.clone()
          const hit = from.clone().lerp(wall, 0.55)
          const p = { k: 0 }
          gsap.to(p, {
            k: 1,
            duration: 0.7,
            ease: 'power1.inOut',
            onUpdate: () => {
              const kk = p.k < 0.4 ? p.k / 0.4 : 1 - (p.k - 0.4) / 0.6
              tmp.copy(from).lerp(hit, kk * kk)
              body.current?.setNextKinematicTranslation(tmp)
            },
            onComplete: () => {
              body.current?.setTranslation(from, true)
              toDynamic()
              useWorld.getState().stopAutopilot()
              onDeny()
            },
          })
          return
        }
        toDynamic()
        useWorld.getState().stopAutopilot()
        if (useWorld.getState().current !== target) useWorld.getState().enter(target, rttFromDistance(packet.distance))
        onArrive(target)
      },
    })
    route.current = { curve, s, target, tween }
    return () => {
      tween.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autopilot])

  // Respawn at hop 0.
  useEffect(() => {
    if (!respawns) return
    const b = body.current
    if (!b) return
    route.current?.tween.kill()
    route.current = null
    b.setBodyType(DYNAMIC, true)
    b.setTranslation(SPAWN, true)
    b.setLinvel({ x: 0, y: 0, z: 0 }, true)
    packet.pos.copy(SPAWN)
  }, [respawns])

  useFrame((state, dtRaw) => {
    const b = body.current
    if (!b) return
    const dt = Math.min(dtRaw, 0.05)
    updateFromKeys()
    const world = useWorld.getState()

    if (route.current) {
      if (hasInput()) {
        // Taking the controls cancels autopilot.
        route.current.tween.kill()
        route.current = null
        toDynamic()
        world.stopAutopilot()
      } else {
        route.current.curve.getPointAt(Math.min(1, Math.max(0, route.current.s.t)), tmp)
        b.setNextKinematicTranslation(tmp)
      }
    }
    if (!route.current && b.bodyType() === DYNAMIC) {
      // Screen-relative steering: the camera never yaws, so up is -Z and right is +X.
      let [dx, dz] = [input.x, -input.y]
      if (input.stick.active) [dx, dz] = snap45(dx, dz)
      const speed = input.boost ? DRIVE.boost : DRIVE.speed
      const v = b.linvel()
      const k = 1 - Math.exp(-dt * DRIVE.response)
      b.setLinvel({ x: v.x + (dx * speed - v.x) * k, y: 0, z: v.z + (dz * speed - v.z) * k }, true)
      if (hasInput()) world.markMoved()
    }

    const t = b.translation()
    packet.pos.set(t.x, PACKET_Y, t.z)
    const step = packet.pos.distanceTo(prev)
    if (step < 60) packet.distance += step
    if (dt > 0) packet.vel.subVectors(packet.pos, prev).divideScalar(dt)
    if (packet.vel.lengthSq() > 0.5) packet.heading = Math.atan2(packet.vel.x, packet.vel.z)

    // Hop detection: entering a ring is arriving; leaving it clears the hop.
    sweep(prev, packet.pos, !!route.current)
    if (world.current && world.current !== 'apps') {
      const n = nodeById(world.current)
      if (Math.hypot(packet.pos.x - n.pos[0], packet.pos.z - n.pos[1]) > n.ring + 2.5) world.leave(world.current)
    }
    if (world.current === 'apps' && Math.hypot(packet.pos.x - firewall.pos[0], packet.pos.z - firewall.pos[1]) > 16) world.leave('apps')
    prev.copy(packet.pos)

    // Visual: float, spin, lean into the direction of travel.
    if (visual.current) {
      visual.current.position.y = Math.sin(state.clock.elapsedTime * 2.2) * 0.12
    }
    if (shell.current) {
      shell.current.rotation.y += dt * 1.4
      shell.current.rotation.x += dt * 0.7
    }
  })

  return (
    <>
      <RigidBody
        ref={body}
        colliders={false}
        position={SPAWN}
        enabledTranslations={[true, false, true]}
        enabledRotations={[false, false, false]}
        linearDamping={0.5}
        ccd
        name="packet"
      >
        <BallCollider args={[0.8]} friction={0} restitution={0.2} />
        <group ref={visual}>
          <mesh raycast={() => null}>
            <octahedronGeometry args={[0.42, 0]} />
            <meshBasicMaterial color={c(theme.packetCore, 4)} />
          </mesh>
          <mesh ref={shell} raycast={() => null}>
            <icosahedronGeometry args={[0.85, 0]} />
            <meshBasicMaterial color={c(theme.packetShell, 2.2)} wireframe />
          </mesh>
          <sprite scale={[2.4, 2.4, 1]} raycast={() => null}>
            <spriteMaterial map={halo} color={c(theme.packetShell, 0.9)} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        </group>
      </RigidBody>
      <Trail />
    </>
  )
}

