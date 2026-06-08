import { Suspense, useEffect, useRef, useState } from 'react'
import { createRoot, events, extend, type ReconcilerRoot } from '@react-three/fiber'
import * as THREE from 'three'
import { Scene } from './components/Scene'
import { Intro } from './components/Intro'
import { AssetSwitcher } from './components/AssetSwitcher'
import { TouchControls } from './components/TouchControls'
import { SilentBoundary } from './components/SilentBoundary'
import { readConfigFromUrl, writeConfigToUrl, type AssetConfig, type AssetKind } from './config'
import { createRenderer, getRendererInfo } from './lib/createRenderer'
import { isTouchDevice, useInput } from './lib/useInput'

// R3F's <Canvas> auto-registers every THREE.* class so JSX primitives like
// <mesh>, <directionalLight>, <planeGeometry> resolve. We bypass <Canvas> and
// use createRoot() directly to await the WebGPU renderer — which means we
// have to call extend() ourselves, once, at module init.
extend(THREE as unknown as Record<string, unknown>)

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<ReconcilerRoot<HTMLCanvasElement> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [config, setConfig] = useState<AssetConfig>(() => readConfigFromUrl())
  const [entered, setEntered] = useState(false)
  const [backend, setBackend] = useState<'webgpu' | 'webgl2' | null>(null)
  const [ready, setReady] = useState(false)
  const [lockedNow, setLockedNow] = useState(false)

  const input = useInput()
  const touch = isTouchDevice()

  // Renderer init + root creation. Runs once on mount.
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const canvas = document.createElement('canvas')
    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.touchAction = 'none'
    canvas.style.outline = 'none'
    container.appendChild(canvas)
    canvasRef.current = canvas

    let cancelled = false

    createRenderer(canvas).then((renderer) => {
      if (cancelled) { try { (renderer as any).dispose?.() } catch {} ; return }
      const root = createRoot(canvas)
      root.configure({
        gl: renderer,
        events,
        camera: { fov: 70, position: [0, 1.65, 6], near: 0.05, far: 90 },
        shadows: true,
        dpr: touch ? [1, 1.5] : [1, 2],
        onCreated: ({ gl }) => {
          ;(gl as any).toneMapping = THREE.ACESFilmicToneMapping
          ;(gl as any).toneMappingExposure = 0.82
          ;(gl as any).outputColorSpace = THREE.SRGBColorSpace
        },
      })
      rootRef.current = root
      setBackend(getRendererInfo().backend)
      setReady(true)
    })

    return () => {
      cancelled = true
      rootRef.current?.unmount()
      rootRef.current = null
      canvas.remove()
      canvasRef.current = null
    }
    // touch is stable per session; config drives a separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-render the R3F tree when config changes (or once ready).
  useEffect(() => {
    if (!ready || !rootRef.current) return
    rootRef.current.render(
      <SilentBoundary label="scene-root">
        <Suspense fallback={null}>
          <Scene config={config} input={input} />
        </Suspense>
      </SilentBoundary>,
    )
  }, [ready, config, input])

  // Track pointer-lock for dimming UI on desktop
  useEffect(() => {
    const onLockChange = () => setLockedNow(document.pointerLockElement !== null)
    document.addEventListener('pointerlockchange', onLockChange)
    return () => document.removeEventListener('pointerlockchange', onLockChange)
  }, [])

  const switchAsset = (kind: AssetKind, value: string) => {
    const next = { ...config, [kind]: value }
    setConfig(next)
    writeConfigToUrl(next)
  }

  const handleEnter = () => {
    setEntered(true)
    if (!touch) {
      canvasRef.current?.requestPointerLock()
    }
  }

  return (
    <>
      <div ref={containerRef} style={{ position: 'fixed', inset: 0 }} />

      {!ready && <div className="loading">initializing</div>}

      <TouchControls input={input} visible={entered && touch} />

      <AssetSwitcher config={config} hidden={lockedNow} onChange={switchAsset} />

      {ready && !entered && <Intro onDismiss={handleEnter} />}

      {backend && <div className="badge">{backend}</div>}
    </>
  )
}
