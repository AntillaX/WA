import * as THREE from 'three'

export type RendererInfo = { backend: 'webgpu' | 'webgl2' }

const info: RendererInfo = { backend: 'webgl2' }
export function getRendererInfo(): RendererInfo { return info }

/**
 * Build a renderer for the given canvas, preferring WebGPU when available.
 * Falls back to WebGL2. The returned renderer is typed as WebGLRenderer so
 * react-three-fiber accepts it; WebGPURenderer is API-compatible for our use.
 */
export async function createRenderer(canvas: HTMLCanvasElement): Promise<THREE.WebGLRenderer> {
  const forceGL = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('renderer') === 'webgl'

  if (!forceGL && typeof navigator !== 'undefined' && 'gpu' in navigator) {
    try {
      const mod = await import('three/webgpu')
      const WebGPURenderer = (mod as any).WebGPURenderer
      const renderer = new WebGPURenderer({
        canvas,
        antialias: window.devicePixelRatio < 2,
        powerPreference: 'high-performance',
      })
      await renderer.init()
      info.backend = 'webgpu'
      // eslint-disable-next-line no-console
      console.info('[wa] WebGPU renderer initialized')
      return renderer as unknown as THREE.WebGLRenderer
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[wa] WebGPU init failed, falling back to WebGL2', e)
    }
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: window.devicePixelRatio < 2,
    powerPreference: 'high-performance',
  })
  info.backend = 'webgl2'
  // eslint-disable-next-line no-console
  console.info('[wa] WebGL2 renderer initialized')
  return renderer
}
