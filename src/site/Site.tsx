import { Component, Suspense, lazy, useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import TwoD from './TwoD'
import { bootMode, setHtmlMode, setPref, type Mode } from './boot'
import { home, isSectionId, sectionById } from './sections'

const WorldLayer = lazy(() => import('../world/WorldLayer'))

class WorldBoundary extends Component<{ onError: (e: Error) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    this.props.onError(error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * Every site route renders the full 2D page (it is what the prerendered HTML contains).
 * When the boot script picked 3D, the world is lazy-loaded on top and the 2D page is hidden.
 */
export default function Site({ force2d = false }: { force2d?: boolean }) {
  const params = useParams()
  const id = isSectionId(params.section) ? params.section : undefined
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('2d')
  const [notice, setNotice] = useState<string>()

  // Decide after hydration, so the first client render matches the prerendered HTML.
  useEffect(() => {
    if (!force2d && bootMode() === '3d') setMode('3d')
  }, [force2d])

  useEffect(() => {
    setHtmlMode(mode)
  }, [mode])

  useEffect(() => {
    const meta = sectionById(id)
    document.title = meta ? meta.title : home.title
  }, [id])

  // In 2D, a section route scrolls to that section.
  useEffect(() => {
    if (mode !== '2d') return
    const target = id ?? (location.hash ? location.hash.slice(1) : undefined)
    document.querySelectorAll('[data-target]').forEach((el) => el.removeAttribute('data-target'))
    if (!target) return
    const el = document.getElementById(target)
    if (el) {
      el.setAttribute('data-target', '')
      el.scrollIntoView({ block: 'start' })
    }
  }, [mode, id])

  const to2d = useCallback(
    (why?: string) => {
      setPref('2d')
      setMode('2d')
      setNotice(why)
      navigate(id ? `/2d#${id}` : '/2d')
    },
    [id, navigate],
  )

  const to3d = useCallback(() => {
    setPref('3d')
    setNotice(undefined)
    setMode('3d')
    navigate(id ? `/${id}` : '/')
  }, [id, navigate])

  const fail = useCallback((e: Error | string) => to2d(`The 3D view could not start (${typeof e === 'string' ? e : e.message}). This is the text version.`), [to2d])

  return (
    <>
      <TwoD active={id} hidden={mode === '3d'} notice={notice} onEnter3d={to3d} />
      {mode === '3d' && (
        <WorldBoundary onError={fail}>
          <Suspense fallback={null}>
            <WorldLayer section={id} onExit={() => to2d()} onFail={fail} />
          </Suspense>
        </WorldBoundary>
      )}
    </>
  )
}
