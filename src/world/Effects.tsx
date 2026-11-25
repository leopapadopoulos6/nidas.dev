import { useEffect, useMemo, useState } from 'react'
import { Bloom, ChromaticAberration, EffectComposer, Glitch, Noise, Scanline, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, GlitchMode, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { useWorld } from './store'
import { theme } from './theme'

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** CRT treatment. "low" keeps tone mapping and vignette only. Arrivals trigger a short screen tear. */
export default function Effects() {
  const quality = useWorld((s) => s.quality)
  const arrivals = useWorld((s) => s.arrivals)
  const denials = useWorld((s) => s.denials)
  const [tear, setTear] = useState(false)
  const calm = useMemo(reducedMotion, [])
  const chroma = useMemo(() => new THREE.Vector2(0.0012, 0.0007), [])

  useEffect(() => {
    if (calm || arrivals + denials === 0) return
    setTear(true)
    const t = setTimeout(() => setTear(false), 260)
    return () => clearTimeout(t)
  }, [arrivals, denials, calm])

  if (quality === 'low') {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <ToneMapping mode={ToneMappingMode.NEUTRAL} />
        <Vignette offset={0.28} darkness={0.75} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={theme.bloom.intensity} luminanceThreshold={theme.bloom.threshold} luminanceSmoothing={theme.bloom.smoothing} radius={theme.bloom.radius} />
      <ChromaticAberration offset={chroma} radialModulation modulationOffset={0.25} />
      <Glitch active={tear} mode={GlitchMode.CONSTANT_MILD} delay={new THREE.Vector2(0, 0)} duration={new THREE.Vector2(0.2, 0.3)} strength={new THREE.Vector2(0.08, 0.2)} ratio={0.8} />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
      <Scanline blendFunction={BlendFunction.OVERLAY} density={1.35} opacity={0.22} />
      <Noise premultiply={false} blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.19} />
      <Vignette offset={0.28} darkness={0.85} />
    </EffectComposer>
  )
}
