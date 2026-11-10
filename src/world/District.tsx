import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { sectionById } from '../site/sections'
import { BOUNDS, FIREWALL_ROT, buildCity, links, nodes, type HopNode, type NodeId } from './layout'
import * as S from './shaders'
import { packet, useWorld } from './store'
import { theme } from './theme'

const c = (hex: string, k = 1) => new THREE.Color(hex).multiplyScalar(k)
const fogged = <T extends Record<string, THREE.IUniform>>(u: T) => THREE.UniformsUtils.merge([THREE.UniformsLib.fog, u]) as T

/** Shared clock for shader animation (seconds). */
function useTime() {
  const t = useRef(0)
  useFrame((s) => (t.current = s.clock.elapsedTime))
  return t
}

function Floor() {
  const uniforms = useMemo(
    () =>
      fogged({
        uBase: { value: c(theme.floorBase) },
        uMinor: { value: c(theme.gridMinor, 1.2) },
        uMajor: { value: c(theme.gridMajor, 1.4) },
        uGlow: { value: c(theme.packetShell, 0.55) },
        uPacket: { value: new THREE.Vector3() },
        uDots: { value: 1 },
        uAlpha: { value: 1 },
      }),
    [],
  )
  useFrame(() => uniforms.uPacket.value.copy(packet.pos))
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[600, 600]} />
      <shaderMaterial vertexShader={S.floorVert} fragmentShader={S.floorFrag} uniforms={uniforms} fog />
    </mesh>
  )
}

function City() {
  const buildings = useMemo(() => buildCity(11), [])
  const geom = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), [])
  const time = useTime()
  const uniforms = useMemo(
    () =>
      fogged({
        uFill: { value: c(theme.fill) },
        uFillTop: { value: c(theme.fillTop) },
        uEdge: { value: c(theme.edge) },
        uEdgeOpacity: { value: theme.edgeOpacity },
        uWin0: { value: c(theme.windows[0]) },
        uWin1: { value: c(theme.windows[1]) },
        uWin2: { value: c(theme.windows[2]) },
        uWinDensity: { value: theme.windowDensity },
        uWinStyle: { value: 1 },
        uTime: { value: 0 },
      }),
    [],
  )
  const ref = useRef<THREE.InstancedMesh>(null)
  useFrame(() => (uniforms.uTime.value = time.current))
  const setup = (m: THREE.InstancedMesh | null) => {
    ref.current = m
    if (!m) return
    const o = new THREE.Object3D()
    buildings.forEach((b, i) => {
      o.position.set(b.x, 0, b.z)
      o.scale.set(b.w, b.h, b.d)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
    m.computeBoundingSphere()
  }
  return (
    <>
      <instancedMesh ref={setup} args={[geom, undefined, buildings.length]} frustumCulled={false}>
        <shaderMaterial vertexShader={S.buildingVert} fragmentShader={S.buildingFrag} uniforms={uniforms} fog />
      </instancedMesh>
      <RigidBody type="fixed" colliders={false}>
        {buildings
          .filter((b) => b.solid)
          .map((b, i) => (
            <CuboidCollider key={i} args={[b.w / 2, 2, b.d / 2]} position={[b.x, 1.25, b.z]} />
          ))}
        {/* play-area walls */}
        <CuboidCollider args={[1, 3, (BOUNDS.maxZ - BOUNDS.minZ) / 2]} position={[BOUNDS.minX, 1.25, (BOUNDS.maxZ + BOUNDS.minZ) / 2]} />
        <CuboidCollider args={[1, 3, (BOUNDS.maxZ - BOUNDS.minZ) / 2]} position={[BOUNDS.maxX, 1.25, (BOUNDS.maxZ + BOUNDS.minZ) / 2]} />
        <CuboidCollider args={[(BOUNDS.maxX - BOUNDS.minX) / 2, 3, 1]} position={[0, 1.25, BOUNDS.minZ]} />
        <CuboidCollider args={[(BOUNDS.maxX - BOUNDS.minX) / 2, 3, 1]} position={[0, 1.25, BOUNDS.maxZ]} />
      </RigidBody>
    </>
  )
}

function Links() {
  const time = useTime()
  const mats = useRef<THREE.ShaderMaterial[]>([])
  useFrame(() => mats.current.forEach((m) => m && (m.uniforms.uTime.value = time.current)))
  return (
    <group>
      {links.map((l, i) => {
        const dx = l.to[0] - l.from[0]
        const dz = l.to[1] - l.from[1]
        const len = Math.hypot(dx, dz)
        const ang = Math.atan2(-dz, dx)
        const mid: [number, number, number] = [(l.from[0] + l.to[0]) / 2, 0, (l.from[1] + l.to[1]) / 2]
        const mk = (glow: boolean) =>
          fogged({
            uColor: { value: c(l.dead ? '#7a1e1e' : theme.link, glow ? 0.9 : 1.2) },
            uPulse: { value: c(l.dead ? '#ff4f4f' : theme.pulse) },
            uTime: { value: 0 },
            uLen: { value: len },
            uDead: { value: l.dead ? 1 : 0 },
            uGlowStrip: { value: glow ? 1 : 0 },
          })
        return (
          <group key={i} position={mid} rotation-y={ang}>
            <mesh rotation-x={-Math.PI / 2} position-y={0.06}>
              <planeGeometry args={[len, 0.22]} />
              <shaderMaterial
                ref={(m) => {
                  if (m) mats.current[i * 2] = m
                }}
                vertexShader={S.linkVert}
                fragmentShader={S.linkFrag}
                uniforms={mk(false)}
                fog
              />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position-y={0.04}>
              <planeGeometry args={[len, 1.8]} />
              <shaderMaterial
                ref={(m) => {
                  if (m) mats.current[i * 2 + 1] = m
                }}
                vertexShader={S.linkVert}
                fragmentShader={S.linkFrag}
                uniforms={mk(true)}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                fog
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function Edged({ size, position, color = theme.edge, k = 1 }: { size: [number, number, number]; position: [number, number, number]; color?: string; k?: number }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)), [size])
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial color={theme.fillTop} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={c(color, 1.6 * k)} />
      </lineSegments>
    </group>
  )
}

function useArrow() {
  return useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.16, 0)
    s.lineTo(0.16, 0)
    s.lineTo(0.16, 1.1)
    s.lineTo(0.42, 1.1)
    s.lineTo(0, 1.6)
    s.lineTo(-0.42, 1.1)
    s.lineTo(-0.16, 1.1)
    s.closePath()
    return new THREE.ShapeGeometry(s)
  }, [])
}

function Router({ active }: { active: boolean }) {
  const arrow = useArrow()
  const glow = c(active ? theme.active : theme.ring, 2.4)
  return (
    <group>
      <mesh position-y={0.3}>
        <cylinderGeometry args={[3.5, 3.7, 0.6, 48]} />
        <meshBasicMaterial color={theme.fill} />
      </mesh>
      <mesh position-y={1.35}>
        <cylinderGeometry args={[3, 3, 1.5, 48]} />
        <meshBasicMaterial color={theme.fillTop} />
      </mesh>
      <mesh position-y={2.1} rotation-x={Math.PI / 2}>
        <torusGeometry args={[3, 0.06, 8, 64]} />
        <meshBasicMaterial color={glow} />
      </mesh>
      <mesh position-y={0.62} rotation-x={Math.PI / 2}>
        <torusGeometry args={[3.02, 0.05, 8, 64]} />
        <meshBasicMaterial color={c(theme.ring, 1.2)} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={arrow} rotation-x={-Math.PI / 2} rotation-z={(i * Math.PI) / 2 + Math.PI / 4} position-y={2.11}>
          <meshBasicMaterial color={glow} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function Switch() {
  const ports = useMemo(() => {
    const p: [number, number, number][] = []
    for (let s = 0; s < 3; s++) for (let r = 0; r < 2; r++) for (let i = 0; i < 18; i++) p.push([-3.8 + i * 0.45, 0.62 + s * 1.15 + r * 0.26, 1.82])
    return p
  }, [])
  const setup = (m: THREE.InstancedMesh | null) => {
    if (!m) return
    const o = new THREE.Object3D()
    ports.forEach((p, i) => {
      o.position.set(...p)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
      const r = Math.abs(Math.sin(i * 91.7) * 43758.5453) % 1
      m.setColorAt(i, r > 0.25 ? c(r > 0.9 ? theme.active : theme.ring, 2.2) : c(theme.gridMinor))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }
  return (
    <group rotation-y={-0.5}>
      {[0, 1, 2].map((s) => (
        <Edged key={s} size={[9, 0.9, 3.6]} position={[0, 0.7 + s * 1.15, 0]} />
      ))}
      <instancedMesh ref={setup} args={[undefined, undefined, ports.length]}>
        <boxGeometry args={[0.26, 0.12, 0.06]} />
        <meshBasicMaterial />
      </instancedMesh>
    </group>
  )
}

function Server() {
  const bars = useRef<THREE.Group>(null)
  useFrame((s) => {
    const g = bars.current
    if (!g) return
    const t = s.clock.elapsedTime
    g.children.forEach((ch, i) => {
      const m = (ch as THREE.Mesh).material as THREE.MeshBasicMaterial
      const v = 0.5 + 0.5 * Math.sin(t * (1 + (i % 5) * 0.7) + i * 1.7)
      m.color.copy(c(i % 7 === 0 ? theme.active : theme.ring, 0.6 + v * 2.2))
    })
  })
  return (
    <group rotation-y={0.4}>
      {[-3.2, 0, 3.2].map((x, k) => (
        <Edged key={k} size={[2.6, 9 + k * 1.5, 2.6]} position={[x, (9 + k * 1.5) / 2, 0]} />
      ))}
      <group ref={bars}>
        {[-3.2, 0, 3.2].flatMap((x, k) =>
          Array.from({ length: 11 + k * 2 }, (_, j) => (
            <mesh key={`${k}-${j}`} position={[x, 0.9 + j * 0.72, 1.32]}>
              <boxGeometry args={[1.9, 0.08, 0.04]} />
              <meshBasicMaterial color={theme.ring} />
            </mesh>
          )),
        )}
      </group>
    </group>
  )
}

function AccessPoint() {
  const rings = useRef<THREE.Group>(null)
  useFrame((s) => {
    const g = rings.current
    if (!g) return
    g.children.forEach((ch, i) => {
      const ph = (s.clock.elapsedTime * 0.45 + i / 3) % 1
      ch.scale.setScalar(0.6 + ph * 5)
      ;((ch as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.9
    })
  })
  return (
    <group>
      <mesh position-y={0.4}>
        <cylinderGeometry args={[1.6, 1.9, 0.8, 32]} />
        <meshBasicMaterial color={theme.fillTop} />
      </mesh>
      <mesh position-y={5}>
        <cylinderGeometry args={[0.16, 0.28, 9, 12]} />
        <meshBasicMaterial color={theme.fillTop} />
      </mesh>
      <mesh position-y={9.7}>
        <sphereGeometry args={[0.42, 20, 16]} />
        <meshBasicMaterial color={c(theme.ring, 3)} />
      </mesh>
      <group ref={rings} position-y={9.7}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-x={Math.PI / 2}>
            <torusGeometry args={[1, 0.035, 6, 64]} />
            <meshBasicMaterial color={c(theme.ring, 2)} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Firewall() {
  const bricks = useMemo(() => {
    const b: { p: [number, number, number]; hot: boolean }[] = []
    for (let r = 0; r < 6; r++)
      for (let i = 0; i < 9; i++) {
        const x = -7 + i * 1.6 + (r % 2 ? 0.8 : 0)
        if (x > 7.2) continue
        b.push({ p: [x, 0.55 + r * 1.05, 0], hot: (i * 7 + r * 3) % 5 === 0 })
      }
    return b
  }, [])
  const hot = useRef<THREE.MeshBasicMaterial>(null)
  const denials = useWorld((s) => s.denials)
  const flash = useRef(0)
  const seen = useRef(denials)
  useFrame((s, dt) => {
    if (seen.current !== denials) {
      seen.current = denials
      flash.current = 1
    }
    flash.current = Math.max(0, flash.current - dt * 1.5)
    if (hot.current) hot.current.color.copy(c('#ff4f4f', 1.4 + 1.2 * (0.5 + 0.5 * Math.sin(s.clock.elapsedTime * 2.4)) + flash.current * 4))
  })
  const firstHot = bricks.findIndex((x) => x.hot)
  return (
    <group rotation-y={FIREWALL_ROT}>
      {bricks.map((b, i) =>
        b.hot ? (
          <mesh key={i} position={b.p}>
            <boxGeometry args={[1.45, 0.92, 1]} />
            <meshBasicMaterial ref={i === firstHot ? hot : undefined} color={c('#ff4f4f', 2)} />
          </mesh>
        ) : (
          <Edged key={i} size={[1.45, 0.92, 1]} position={b.p} color="#ff4f4f" k={0.8} />
        ),
      )}
    </group>
  )
}

function Beacon({ color, height = 46 }: { color: THREE.Color; height?: number }) {
  const time = useTime()
  const uniforms = useMemo(() => fogged({ uColor: { value: color }, uTime: { value: 0 } }), [color])
  useFrame(() => (uniforms.uTime.value = time.current))
  return (
    <mesh position-y={height / 2} raycast={() => null}>
      <cylinderGeometry args={[0.12, 0.42, height, 12, 1, true]} />
      <shaderMaterial vertexShader={S.linkVert} fragmentShader={S.beamFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} fog />
    </mesh>
  )
}

const labelY: Record<HopNode['kind'], number> = { gateway: 3, router: 5.5, switch: 6.5, server: 15, ap: 12.5, firewall: 9 }

function NodeSite({ node, active, onPick }: { node: HopNode; active: boolean; onPick: (id: NodeId) => void }) {
  const ringCol = useMemo(() => c(active ? theme.active : theme.ring, active ? 2.6 : 1.8), [active])
  const beam = useMemo(() => c(node.kind === 'firewall' ? '#ff4f4f' : active ? theme.active : theme.ring, active ? 0.9 : 1.2), [active, node.kind])
  const label = node.kind === 'gateway' ? 'you' : node.kind === 'firewall' ? '/apps' : sectionById(node.id)?.label
  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (node.kind !== 'gateway') onPick(node.id)
  }
  const body = {
    gateway: null,
    router: <Router active={active} />,
    switch: <Switch />,
    server: <Server />,
    ap: <AccessPoint />,
    firewall: <Firewall />,
  }[node.kind]
  return (
    <group position={[node.pos[0], 0, node.pos[1]]}>
      {node.ring > 0 && (
        <>
          <mesh rotation-x={-Math.PI / 2} position-y={0.02} raycast={() => null}>
            <circleGeometry args={[node.ring + 2.2, 64]} />
            <meshBasicMaterial color={theme.fill} transparent opacity={0.9} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position-y={0.08} raycast={() => null}>
            <ringGeometry args={[node.ring - 0.09, node.ring + 0.09, 96]} />
            <meshBasicMaterial color={ringCol} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position-y={0.06} raycast={() => null}>
            <ringGeometry args={[node.ring + 2.05, node.ring + 2.2, 96]} />
            <meshBasicMaterial color={c(theme.ring, 0.7)} />
          </mesh>
        </>
      )}
      <group onClick={pick} onPointerOver={() => node.kind !== 'gateway' && (document.body.style.cursor = 'pointer')} onPointerOut={() => (document.body.style.cursor = '')}>
        {body}
      </group>
      {node.kind !== 'gateway' && <Beacon color={beam} />}
      <Html position={[0, labelY[node.kind], 0]} center zIndexRange={[10, 0]} className="node-label-wrap">
        <button
          type="button"
          className={`node-label ${active ? 'is-active' : ''} ${node.kind === 'firewall' ? 'is-denied' : ''}`}
          onClick={() => node.kind !== 'gateway' && onPick(node.id)}
          tabIndex={-1}
          aria-hidden="true"
        >
          <span className="node-label__hop">{node.kind === 'firewall' ? '✕' : String(node.hop).padStart(2, '0')}</span>
          <span className="node-label__name">{label}</span>
        </button>
      </Html>
    </group>
  )
}

/** Static colliders for the devices in each plaza and the firewall. */
function DeviceColliders({ onFirewall }: { onFirewall: () => void }) {
  const at = (id: NodeId) => nodes.find((n) => n.id === id)!.pos
  const [ax, az] = at('about')
  const [ex, ez] = at('experience')
  const [px, pz] = at('projects')
  const [cx, cz] = at('contact')
  const [fx, fz] = at('apps')
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[1.5, 3.7]} position={[ax, 1.25, az]} />
        <CuboidCollider args={[4.6, 2, 1.9]} position={[ex, 1.25, ez]} rotation={[0, -0.5, 0]} />
        <CuboidCollider args={[4.6, 2, 1.4]} position={[px, 1.25, pz]} rotation={[0, 0.4, 0]} />
        <CylinderCollider args={[1.5, 1.9]} position={[cx, 1.25, cz]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} onCollisionEnter={onFirewall}>
        <CuboidCollider args={[7.6, 3, 0.7]} position={[fx, 1.25, fz]} rotation={[0, FIREWALL_ROT, 0]} restitution={1.4} />
      </RigidBody>
    </>
  )
}

export default function District({ onPick, onFirewall }: { onPick: (id: NodeId) => void; onFirewall: () => void }) {
  const current = useWorld((s) => s.current)
  const panel = useWorld((s) => s.panel)
  return (
    <>
      <Floor />
      <City />
      <Links />
      {nodes.map((n) => (
        <NodeSite key={n.id} node={n} active={n.id === panel || (n.id === current && n.kind !== 'gateway')} onPick={onPick} />
      ))}
      <DeviceColliders onFirewall={onFirewall} />
    </>
  )
}
