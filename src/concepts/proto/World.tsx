import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, MeshReflectorMaterial } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Noise, Scanline, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import type { SceneTheme } from '../directions'
import { PACKET_Y, buildCity, buildLinks, buildRoute, firewall, nodes, type HopNode } from './layout'
import * as S from './shaders'

const c = (hex: string, k = 1) => new THREE.Color(hex).multiplyScalar(k)

export interface WorldProps {
  theme: SceneTheme
  directionId: string
  fixedU?: number // freeze the packet at this route position (0..1)
  fixedT?: number // freeze shader time
  panelNode?: string // frame this node for the arrival shot
  onHop?: (hop: number) => void
  hiQuality?: boolean
  autopilotTo?: string // live mode: fly the packet to this node, then call onArrive
  onArrive?: (id: string) => void
}

function useFogUniforms<T extends Record<string, THREE.IUniform>>(u: T) {
  return useMemo(() => THREE.UniformsUtils.merge([THREE.UniformsLib.fog, u]) as T, [u])
}

function Floor({ theme, packet }: { theme: SceneTheme; packet: React.RefObject<THREE.Vector3> }) {
  const uniforms = useFogUniforms(
    useMemo(
      () => ({
        uBase: { value: theme.reflectiveFloor ? new THREE.Color(0, 0, 0) : c(theme.floorBase) },
        uMinor: { value: c(theme.gridMinor, 1.2) },
        uMajor: { value: c(theme.gridMajor, 1.4) },
        uGlow: { value: c(theme.packetShell, 0.6) },
        uPacket: { value: new THREE.Vector3() },
        uDots: { value: theme.gridStyle === 'dots' ? 1 : 0 },
        uAlpha: { value: 1 },
      }),
      [theme],
    ),
  )
  useFrame(() => uniforms.uPacket.value.copy(packet.current))
  return (
    <group>
      {theme.reflectiveFloor && <ambientLight intensity={1.6} />}
      {theme.reflectiveFloor && (
        <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
          <planeGeometry args={[600, 600]} />
          <MeshReflectorMaterial
            resolution={1024}
            mirror={1}
            blur={[120, 30]}
            mixBlur={0.7}
            mixStrength={2.4}
            mixContrast={1}
            depthScale={0}
            roughness={1}
            metalness={0}
            color="#a48cc8"
          />
        </mesh>
      )}
      <mesh rotation-x={-Math.PI / 2} renderOrder={theme.reflectiveFloor ? 1 : 0}>
        <planeGeometry args={[600, 600]} />
        <shaderMaterial
          vertexShader={S.floorVert}
          fragmentShader={S.floorFrag}
          uniforms={uniforms}
          fog
          transparent={theme.reflectiveFloor}
          blending={theme.reflectiveFloor ? THREE.AdditiveBlending : THREE.NormalBlending}
          depthWrite={!theme.reflectiveFloor}
        />
      </mesh>
    </group>
  )
}

function City({ theme, time }: { theme: SceneTheme; time: React.RefObject<number> }) {
  const buildings = useMemo(() => buildCity(11), [])
  const geom = useMemo(() => new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), [])
  const uniforms = useFogUniforms(
    useMemo(
      () => ({
        uFill: { value: c(theme.fill) },
        uFillTop: { value: c(theme.fillTop) },
        uEdge: { value: c(theme.edge) },
        uEdgeOpacity: { value: theme.edgeOpacity },
        uWin0: { value: c(theme.windows[0]) },
        uWin1: { value: c(theme.windows[1 % theme.windows.length]) },
        uWin2: { value: c(theme.windows[2 % theme.windows.length]) },
        uWinDensity: { value: theme.windowDensity },
        uWinStyle: { value: theme.windowStyle === 'strips' ? 0 : 1 },
        uTime: { value: 0 },
      }),
      [theme],
    ),
  )
  const ref = useRef<THREE.InstancedMesh>(null)
  useMemo(() => {
    queueMicrotask(() => {
      const m = ref.current
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
    })
  }, [buildings])
  useFrame(() => (uniforms.uTime.value = time.current))
  return (
    <instancedMesh ref={ref} args={[geom, undefined, buildings.length]} frustumCulled={false}>
      <shaderMaterial vertexShader={S.buildingVert} fragmentShader={S.buildingFrag} uniforms={uniforms} fog />
    </instancedMesh>
  )
}

function Links({ theme, time }: { theme: SceneTheme; time: React.RefObject<number> }) {
  const links = useMemo(() => buildLinks(), [])
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
          THREE.UniformsUtils.merge([
            THREE.UniformsLib.fog,
            {
              uColor: { value: c(l.dead ? theme.alert : theme.link, glow ? 0.9 : 1.2) },
              uPulse: { value: c(l.dead ? theme.alert : theme.pulse) },
              uTime: { value: 0 },
              uLen: { value: len },
              uDead: { value: l.dead ? 1 : 0 },
              uGlowStrip: { value: glow ? 1 : 0 },
            },
          ])
        return (
          <group key={i} position={mid} rotation-y={ang}>
            {/* core fiber */}
            <mesh rotation-z={-Math.PI / 2} position-y={0.14}>
              <cylinderGeometry args={[0.08, 0.08, len, 6, 1, true]} />
              <shaderMaterial
                ref={(m) => {
                  if (m) mats.current[i * 2] = m
                }}
                vertexShader={S.linkVert}
                fragmentShader={S.linkFrag.replace('float s = vUv.x * uLen;', 'float s = (1.0 - vUv.y) * uLen;').replace('smoothstep(0.5, 0.95, vUv.x)', 'smoothstep(0.5, 0.95, 1.0 - vUv.y)').replace('smoothstep(0.75, 1.0, vUv.x)', 'smoothstep(0.75, 1.0, 1.0 - vUv.y)')}
                uniforms={mk(false)}
                fog
              />
            </mesh>
            {/* light strip on the ground */}
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

function Edged({ size, position, theme, edgeK = 1 }: { size: [number, number, number]; position: [number, number, number]; theme: SceneTheme; edgeK?: number }) {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)), [size])
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial color={theme.fillTop} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={c(theme.edge, 1.6 * edgeK)} transparent opacity={Math.min(1, theme.edgeOpacity + 0.3)} />
      </lineSegments>
    </group>
  )
}

function ArrowShape() {
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

function Router({ theme, active }: { theme: SceneTheme; active: boolean }) {
  const arrow = ArrowShape()
  const glow = c(active ? theme.active : theme.accent, 2.4)
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
        <meshBasicMaterial color={c(theme.accent, 1.2)} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} geometry={arrow} rotation-x={-Math.PI / 2} rotation-z={(i * Math.PI) / 2 + Math.PI / 4} position-y={2.11}>
          <meshBasicMaterial color={glow} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function Switch({ theme }: { theme: SceneTheme }) {
  const ports = useMemo(() => {
    const p: [number, number, number][] = []
    for (let s = 0; s < 3; s++) for (let r = 0; r < 2; r++) for (let i = 0; i < 18; i++) p.push([-3.8 + i * 0.45, 0.62 + s * 1.15 + r * 0.26, 1.82])
    return p
  }, [])
  const ref = useRef<THREE.InstancedMesh>(null)
  useMemo(() => {
    queueMicrotask(() => {
      const m = ref.current
      if (!m) return
      const o = new THREE.Object3D()
      const rnd = (i: number) => (Math.sin(i * 91.7) * 43758.5453) % 1
      ports.forEach((p, i) => {
        o.position.set(...p)
        o.updateMatrix()
        m.setMatrixAt(i, o.matrix)
        const on = Math.abs(rnd(i)) > 0.25
        m.setColorAt(i, on ? c(Math.abs(rnd(i + 3)) > 0.85 ? theme.active : theme.accent, 2.2) : c(theme.gridMinor))
      })
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    })
  }, [ports, theme])
  return (
    <group rotation-y={-0.5}>
      {[0, 1, 2].map((s) => (
        <Edged key={s} theme={theme} size={[9, 0.9, 3.6]} position={[0, 0.7 + s * 1.15, 0]} />
      ))}
      <instancedMesh ref={ref} args={[undefined, undefined, ports.length]}>
        <boxGeometry args={[0.26, 0.12, 0.06]} />
        <meshBasicMaterial />
      </instancedMesh>
    </group>
  )
}

function Server({ theme, time }: { theme: SceneTheme; time: React.RefObject<number> }) {
  const bars = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = bars.current
    if (!g) return
    g.children.forEach((ch, i) => {
      const m = (ch as THREE.Mesh).material as THREE.MeshBasicMaterial
      const v = 0.5 + 0.5 * Math.sin(time.current * (1 + (i % 5) * 0.7) + i * 1.7)
      m.color.copy(c(i % 7 === 0 ? theme.active : theme.accent, 0.6 + v * 2.2))
    })
  })
  return (
    <group rotation-y={0.4}>
      {[-3.2, 0, 3.2].map((x, k) => (
        <Edged key={k} theme={theme} size={[2.6, 9 + k * 1.5, 2.6]} position={[x, (9 + k * 1.5) / 2, 0]} />
      ))}
      <group ref={bars}>
        {[-3.2, 0, 3.2].flatMap((x, k) =>
          Array.from({ length: 11 + k * 2 }, (_, j) => (
            <mesh key={`${k}-${j}`} position={[x, 0.9 + j * 0.72, 1.32]}>
              <boxGeometry args={[1.9, 0.08, 0.04]} />
              <meshBasicMaterial color={theme.accent} />
            </mesh>
          )),
        )}
      </group>
    </group>
  )
}

function AccessPoint({ theme, time }: { theme: SceneTheme; time: React.RefObject<number> }) {
  const rings = useRef<THREE.Group>(null)
  useFrame(() => {
    const g = rings.current
    if (!g) return
    g.children.forEach((ch, i) => {
      const ph = (time.current * 0.45 + i / 3) % 1
      ch.scale.setScalar(0.6 + ph * 5)
      const m = (ch as THREE.Mesh).material as THREE.MeshBasicMaterial
      m.opacity = (1 - ph) * 0.9
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
        <meshBasicMaterial color={c(theme.accent, 3)} />
      </mesh>
      <group ref={rings} position-y={9.7}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-x={Math.PI / 2}>
            <torusGeometry args={[1, 0.035, 6, 64]} />
            <meshBasicMaterial color={c(theme.accent, 2)} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Firewall({ theme, time }: { theme: SceneTheme; time: React.RefObject<number> }) {
  const bricks = useMemo(() => {
    const b: { p: [number, number, number]; hot: boolean }[] = []
    for (let r = 0; r < 6; r++)
      for (let i = 0; i < 9; i++) {
        const off = r % 2 ? 0.8 : 0
        const x = -7 + i * 1.6 + off
        if (x > 7.2) continue
        b.push({ p: [x, 0.55 + r * 1.05, 0], hot: (i * 7 + r * 3) % 5 === 0 })
      }
    return b
  }, [])
  const hot = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    if (hot.current) hot.current.color.copy(c(theme.alert, 1.4 + 1.2 * (0.5 + 0.5 * Math.sin(time.current * 2.4))))
  })
  return (
    <group rotation-y={-0.9}>
      {bricks.map((b, i) =>
        b.hot ? (
          <mesh key={i} position={b.p}>
            <boxGeometry args={[1.45, 0.92, 1]} />
            <meshBasicMaterial ref={i === bricks.findIndex((x) => x.hot) ? hot : undefined} color={c(theme.alert, 2)} />
          </mesh>
        ) : (
          <Edged key={i} theme={{ ...theme, edge: theme.alert }} size={[1.45, 0.92, 1]} position={b.p} edgeK={0.8} />
        ),
      )}
    </group>
  )
}

function Beacon({ color, height = 46, time }: { color: THREE.Color; height?: number; time: React.RefObject<number> }) {
  const uniforms = useFogUniforms(useMemo(() => ({ uColor: { value: color }, uTime: { value: 0 } }), [color]))
  useFrame(() => (uniforms.uTime.value = time.current))
  return (
    <mesh position-y={height / 2}>
      <cylinderGeometry args={[0.12, 0.42, height, 12, 1, true]} />
      <shaderMaterial
        vertexShader={S.linkVert}
        fragmentShader={S.beamFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        fog
      />
    </mesh>
  )
}

function NodeSite({ node, theme, time, active, labelClass }: { node: HopNode; theme: SceneTheme; time: React.RefObject<number>; active: boolean; labelClass: string }) {
  const ringCol = c(active ? theme.active : theme.ring, active ? 2.6 : 1.8)
  const body: Record<string, ReactNode> = {
    gateway: null,
    router: <Router theme={theme} active={active} />,
    switch: <Switch theme={theme} />,
    server: <Server theme={theme} time={time} />,
    ap: <AccessPoint theme={theme} time={time} />,
    firewall: <Firewall theme={theme} time={time} />,
  }
  const labelY = { gateway: 3, router: 5.5, switch: 6.5, server: 15, ap: 12.5, firewall: 9 }[node.kind]
  return (
    <group position={[node.pos[0], 0, node.pos[1]]}>
      {node.ring > 0 && (
        <>
          <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
            <circleGeometry args={[node.ring + 2.2, 64]} />
            <meshBasicMaterial color={theme.fill} transparent opacity={0.9} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position-y={0.08}>
            <ringGeometry args={[node.ring - 0.09, node.ring + 0.09, 96]} />
            <meshBasicMaterial color={ringCol} />
          </mesh>
          <mesh rotation-x={-Math.PI / 2} position-y={0.06}>
            <ringGeometry args={[node.ring + 2.05, node.ring + 2.2, 96]} />
            <meshBasicMaterial color={c(theme.ring, 0.7)} />
          </mesh>
        </>
      )}
      {body[node.kind]}
      {node.kind !== 'gateway' && <Beacon color={c(node.kind === 'firewall' ? theme.alert : active ? theme.active : theme.accent, active ? 0.9 : 1.3)} time={time} />}
      <Html position={[0, labelY, 0]} center zIndexRange={[10, 0]} className={labelClass}>
        <div className={`node-label ${active ? 'is-active' : ''} ${node.kind === 'firewall' ? 'is-denied' : ''}`}>
          <span className="node-label__hop">{node.kind === 'firewall' ? '✕' : String(node.hop).padStart(2, '0')}</span>
          <span className="node-label__name">{node.label}</span>
        </div>
      </Html>
    </group>
  )
}

function useHaloTexture() {
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

const TRAIL_SEG = 72
const TRAIL_RAD = 6

function PacketAndTrail({ theme, curve, uRef, time, directionId }: { theme: SceneTheme; curve: THREE.CatmullRomCurve3; uRef: React.RefObject<number>; time: React.RefObject<number>; directionId: string }) {
  const group = useRef<THREE.Group>(null)
  const shell = useRef<THREE.Mesh>(null)
  const halo = useHaloTexture()
  const len = useMemo(() => curve.getLength(), [curve])
  const trailLen = directionId === 'phosphor' ? 22 : directionId === 'hot-path' ? 9 : 10
  const trailR = directionId === 'hot-path' ? 0.42 : directionId === 'phosphor' ? 0.16 : 0.22
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
        const c2 = (i + 1) * TRAIL_RAD + j
        const d = (i + 1) * TRAIL_RAD + ((j + 1) % TRAIL_RAD)
        idx.push(a, c2, b, b, c2, d)
      }
    g.setIndex(idx)
    return g
  }, [])
  const uniforms = useFogUniforms(
    useMemo(() => ({ uHead: { value: c(theme.trailHead, 1.3) }, uTail: { value: c(theme.trailTail, 1.1) }, uOpacity: { value: 0.85 } }), [theme]),
  )
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), s: new THREE.Vector3(), u: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }), [])
  useFrame(() => {
    const u = uRef.current
    const pos = curve.getPointAt(((u % 1) + 1) % 1)
    group.current?.position.copy(pos)
    if (shell.current) {
      shell.current.rotation.y = time.current * 1.4
      shell.current.rotation.x = time.current * 0.7
    }
    const arr = geo.attributes.position.array as Float32Array
    for (let i = 0; i <= TRAIL_SEG; i++) {
      const k = i / TRAIL_SEG
      const uu = (((u - (k * trailLen) / len) % 1) + 1) % 1
      curve.getPointAt(uu, tmp.p)
      curve.getTangentAt(uu, tmp.t)
      tmp.s.crossVectors(tmp.t, tmp.up).normalize()
      tmp.u.crossVectors(tmp.s, tmp.t).normalize()
      const r = trailR * Math.pow(1 - k, 0.7)
      for (let j = 0; j < TRAIL_RAD; j++) {
        const a = (j / TRAIL_RAD) * Math.PI * 2
        const o = (i * TRAIL_RAD + j) * 3
        arr[o] = tmp.p.x + (tmp.s.x * Math.cos(a) + tmp.u.x * Math.sin(a)) * r
        arr[o + 1] = tmp.p.y + (tmp.s.y * Math.cos(a) + tmp.u.y * Math.sin(a)) * r * 0.6
        arr[o + 2] = tmp.p.z + (tmp.s.z * Math.cos(a) + tmp.u.z * Math.sin(a)) * r
      }
    }
    geo.attributes.position.needsUpdate = true
    geo.computeBoundingSphere()
  })
  return (
    <>
      <mesh geometry={geo} frustumCulled={false}>
        <shaderMaterial
          vertexShader={S.trailVert}
          fragmentShader={S.trailFrag}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          fog
        />
      </mesh>
      <group ref={group}>
        <mesh>
          <octahedronGeometry args={[0.42, 0]} />
          <meshBasicMaterial color={c(theme.packetCore, 4)} />
        </mesh>
        <mesh ref={shell}>
          <icosahedronGeometry args={[0.85, 0]} />
          <meshBasicMaterial color={c(theme.packetShell, 2.2)} wireframe />
        </mesh>
        <sprite scale={[2.4, 2.4, 1]}>
          <spriteMaterial map={halo} color={c(theme.packetShell, 0.9)} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      </group>
    </>
  )
}

function Rain({ theme, time, center }: { theme: SceneTheme; time: React.RefObject<number>; center: React.RefObject<THREE.Vector3> }) {
  const geo = useMemo(() => {
    const g = new THREE.InstancedBufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.12, 1.1, 0], 3))
    const n = 2600
    const off = new Float32Array(n * 3)
    let s = 1
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < n; i++) {
      off[i * 3] = (r() - 0.5) * 90
      off[i * 3 + 1] = r() * 40
      off[i * 3 + 2] = (r() - 0.5) * 90
    }
    g.setAttribute('aOffset', new THREE.InstancedBufferAttribute(off, 3))
    g.instanceCount = n
    return g
  }, [])
  const uniforms = useFogUniforms(useMemo(() => ({ uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uColor: { value: c('#9FB8FF', 0.9) } }), []))
  useFrame(() => {
    uniforms.uTime.value = time.current
    uniforms.uCenter.value.copy(center.current)
  })
  void theme
  return (
    <lineSegments geometry={geo} frustumCulled={false}>
      <shaderMaterial vertexShader={S.rainVert} fragmentShader={S.rainFrag} uniforms={uniforms} transparent depthWrite={false} blending={THREE.AdditiveBlending} fog />
    </lineSegments>
  )
}

function Effects({ theme, hiQuality }: { theme: SceneTheme; hiQuality?: boolean }) {
  const fx = [
    <Bloom key="b" mipmapBlur intensity={theme.bloom.intensity} luminanceThreshold={theme.bloom.threshold} luminanceSmoothing={theme.bloom.smoothing} radius={theme.bloom.radius} />,
  ]
  if (theme.chroma > 0) fx.push(<ChromaticAberration key="c" offset={new THREE.Vector2(theme.chroma, theme.chroma * 0.6)} radialModulation modulationOffset={0.25} />)
  fx.push(<ToneMapping key="t" mode={ToneMappingMode.NEUTRAL} />)
  if (theme.scanlines > 0) fx.push(<Scanline key="s" blendFunction={BlendFunction.OVERLAY} density={1.35} opacity={theme.scanlines} />)
  fx.push(<Noise key="n" premultiply={false} blendFunction={BlendFunction.SOFT_LIGHT} opacity={theme.noise * 1.6} />)
  fx.push(<Vignette key="v" offset={0.28} darkness={theme.vignette} />)
  return (
    <EffectComposer multisampling={hiQuality ? 4 : 0} enableNormalPass={false}>
      {fx}
    </EffectComposer>
  )
}

export default function World({ theme, directionId, fixedU, fixedT, panelNode, onHop, hiQuality, autopilotTo, onArrive }: WorldProps) {
  const curve = useMemo(() => buildRoute(), [])
  const len = useMemo(() => curve.getLength(), [curve])
  // route position (0..1) of each node: the point of the loop closest to the node center
  const nodeU = useMemo(() => {
    const out: Record<string, number> = {}
    const p = new THREE.Vector3()
    for (const n of nodes) {
      let best = 0
      let bestD = Infinity
      for (let i = 0; i < 1000; i++) {
        curve.getPointAt(i / 1000, p)
        const dd = Math.hypot(p.x - n.pos[0], p.z - n.pos[1])
        if (dd < bestD) {
          bestD = dd
          best = i / 1000
        }
      }
      out[n.id] = best
    }
    return out
  }, [curve])
  const arrivedRef = useRef<string | undefined>(undefined)
  const blend = useRef(0) // 0 = chase cam, 1 = arrival framing
  const camLook = useRef(new THREE.Vector3(0, 1, 0))
  const lastPanel = useRef<HopNode | undefined>(undefined)
  const { camera, scene } = useThree()
  const time = useRef(fixedT ?? 0)
  const uRef = useRef(fixedU ?? 0.02)
  const packetPos = useRef(new THREE.Vector3())
  const lastHop = useRef(-1)
  const tmp = useMemo(() => ({ cam: new THREE.Vector3(), look: new THREE.Vector3(), tan: new THREE.Vector3(), desired: new THREE.Vector3() }), [])
  const speed = 13
  const panel = panelNode ? nodes.find((n) => n.id === panelNode) : undefined

  useMemo(() => {
    scene.fog = new THREE.FogExp2(theme.background, theme.fogDensity)
    scene.background = new THREE.Color(theme.background)
  }, [scene, theme])

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    time.current = fixedT ?? state.clock.elapsedTime
    if (fixedU === undefined) {
      if (autopilotTo && arrivedRef.current !== autopilotTo) {
        // autopilot: run forward along the loop to the target node, easing in and out
        const target = nodeU[autopilotTo]
        const remaining = (((target - uRef.current) % 1) + 1) % 1
        const remainingM = remaining * len
        const v = Math.min(42, 8 + remainingM * 1.6)
        const step = (d * v) / len
        if (remaining <= step || remainingM < 0.05) {
          uRef.current = target
          arrivedRef.current = autopilotTo
          onArrive?.(autopilotTo)
        } else uRef.current = (uRef.current + step) % 1
      } else if (!autopilotTo && !panel) {
        arrivedRef.current = undefined
        uRef.current = (uRef.current + (d * speed) / len) % 1
      }
    }
    const u = uRef.current
    curve.getPointAt(u, packetPos.current)
    const persp = camera as THREE.PerspectiveCamera
    const live = fixedU === undefined
    if (panel) lastPanel.current = panel
    blend.current = panel ? (live ? Math.min(1, blend.current + d * 1.6) : 1) : live ? Math.max(0, blend.current - d * 2) : 0
    const e = blend.current * blend.current * (3 - 2 * blend.current)
    if (panel && e >= 0.999) {
      // arrival framing: 3/4 view of the node, node held in the left part of the frame
      const [nx, nz] = panel.pos
      const wide = state.size.width > 720 && state.size.width > state.size.height
      tmp.desired.set(nx + (wide ? -14 : -11), wide ? 13 : 16, nz + (wide ? 16 : 22))
      tmp.look.set(nx + (wide ? 6 : 0), wide ? 0.5 : -2.5, nz + (wide ? -2 : 3))
      camera.position.copy(tmp.desired)
      camera.lookAt(tmp.look)
      camLook.current.copy(tmp.look)
    } else if (panel || e > 0) {
      // blending between the chase cam and the arrival framing
      const node = panel ?? lastPanel.current ?? nodes[1]
      const [nx, nz] = node.pos
      const wide = state.size.width > 720 && state.size.width > state.size.height
      const cu = (((u - theme.camera.distance / len) % 1) + 1) % 1
      curve.getPointAt(cu, tmp.cam)
      tmp.cam.y += theme.camera.height
      tmp.desired.set(nx + (wide ? -14 : -11), wide ? 13 : 16, nz + (wide ? 16 : 22))
      tmp.desired.lerp(tmp.cam, 1 - e)
      tmp.look.set(nx + (wide ? 6 : 0), wide ? 0.5 : -2.5, nz + (wide ? -2 : 3))
      curve.getTangentAt(u, tmp.tan)
      tmp.cam.copy(packetPos.current).addScaledVector(tmp.tan, theme.camera.lookAhead)
      tmp.cam.y = PACKET_Y + 0.6
      tmp.look.lerp(tmp.cam, 1 - e)
      camera.position.lerp(tmp.desired, 1 - Math.exp(-d * 8))
      camLook.current.lerp(tmp.look, 1 - Math.exp(-d * 8))
      camera.lookAt(camLook.current)
    } else {
      const portrait = state.size.width / state.size.height < 0.8
      const k = portrait ? 1.25 : 1
      const cu = (((u - (theme.camera.distance * k) / len) % 1) + 1) % 1
      curve.getPointAt(cu, tmp.desired)
      tmp.desired.y += theme.camera.height * k
      curve.getTangentAt(u, tmp.tan)
      tmp.look.copy(packetPos.current).addScaledVector(tmp.tan, theme.camera.lookAhead)
      tmp.look.y = PACKET_Y + 0.6
      if (fixedU !== undefined) camera.position.copy(tmp.desired)
      else camera.position.lerp(tmp.desired, 1 - Math.exp(-d * 6))
      camLook.current.copy(tmp.look)
      camera.lookAt(tmp.look)
    }
    const fov = state.size.width / state.size.height < 0.8 ? theme.camera.fov * 1.3 : theme.camera.fov
    if (persp.fov !== fov) {
      persp.fov = fov
      persp.updateProjectionMatrix()
    }
    if (onHop) {
      let hop = -1
      for (const n of nodes) if (Math.hypot(packetPos.current.x - n.pos[0], packetPos.current.z - n.pos[1]) < n.ring + 1.5) hop = n.hop
      if (hop !== lastHop.current) {
        lastHop.current = hop
        onHop(hop)
      }
    }
  })

  const activeId = panel?.id
  const labelClass = `labels labels--${directionId}`
  return (
    <>
      <Floor theme={theme} packet={packetPos} />
      <City theme={theme} time={time} />
      <Links theme={theme} time={time} />
      {[...nodes, firewall].map((n) => (
        <NodeSite key={n.id} node={n} theme={theme} time={time} active={n.id === activeId} labelClass={labelClass} />
      ))}
      <group position={[firewall.pos[0], 0, firewall.pos[1]]} />
      <PacketAndTrail theme={theme} curve={curve} uRef={uRef} time={time} directionId={directionId} />
      {theme.rain && <Rain theme={theme} time={time} center={packetPos} />}
      <Effects theme={theme} hiQuality={hiQuality} />
    </>
  )
}
