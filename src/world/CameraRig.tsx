import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import * as THREE from 'three'
import { firewall, nodeById, PACKET_Y, type NodeId } from './layout'
import { packet, useWorld } from './store'
import { theme } from './theme'

/**
 * Follow cam: high and steep, fixed yaw (radar-like), so screen directions never rotate.
 * On arrival it blends (GSAP) to a framing of the node that leaves room for the panel.
 */
export default function CameraRig() {
  const { camera, size } = useThree()
  const panel = useWorld((s) => s.panel)
  const blend = useRef({ k: 0 })
  const focusNode = useRef<NodeId | null>(null)
  const v = useMemo(() => ({ follow: new THREE.Vector3(), followLook: new THREE.Vector3(), focus: new THREE.Vector3(), focusLook: new THREE.Vector3(), pos: new THREE.Vector3(), look: new THREE.Vector3() }), [])
  const smoothed = useRef<{ pos: THREE.Vector3; look: THREE.Vector3 } | null>(null)

  useEffect(() => {
    if (panel) focusNode.current = panel
    const tw = gsap.to(blend.current, { k: panel ? 1 : 0, duration: panel ? 0.95 : 0.7, ease: 'power2.inOut' })
    return () => {
      tw.kill()
    }
  }, [panel])

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05)
    const portrait = size.width / size.height < 0.8
    const sheet = size.width <= 720 // panel is a bottom sheet
    const fov = portrait ? theme.camera.fov * 1.32 : theme.camera.fov
    const persp = camera as THREE.PerspectiveCamera
    if (Math.abs(persp.fov - fov) > 0.01) {
      persp.fov = fov
      persp.updateProjectionMatrix()
    }
    const k = portrait ? 1.25 : 1
    v.follow.set(packet.pos.x, PACKET_Y + theme.camera.height * k, packet.pos.z + theme.camera.distance * k)
    v.followLook.set(packet.pos.x, PACKET_Y, packet.pos.z - theme.camera.lookAhead)

    const id = focusNode.current
    if (id) {
      const n = id === 'apps' ? firewall : nodeById(id)
      const [nx, nz] = n.pos
      if (sheet) {
        // Node in the upper part of the screen, above the bottom sheet.
        v.focus.set(nx, 26, nz + 19)
        v.focusLook.set(nx, 0, nz + 9)
      } else {
        // Node on the left, panel on the right.
        v.focus.set(nx - 12, 15, nz + 17)
        v.focusLook.set(nx + 7, 0.5, nz - 1)
      }
    }
    const e = blend.current.k
    v.pos.copy(v.follow).lerp(v.focus, e)
    v.look.copy(v.followLook).lerp(v.focusLook, e)

    if (!smoothed.current) smoothed.current = { pos: v.pos.clone(), look: v.look.clone() }
    const s = 1 - Math.exp(-dt * 6)
    smoothed.current.pos.lerp(v.pos, s)
    smoothed.current.look.lerp(v.look, s)
    camera.position.copy(smoothed.current.pos)
    camera.lookAt(smoothed.current.look)
  })
  return null
}
