import { useEffect, useState } from 'react'
import * as THREE from 'three'

// PBR slot → Poly Haven filename suffix
const SUFFIXES = {
  map: 'diff',
  normalMap: 'nor_gl',
  roughnessMap: 'rough',
  aoMap: 'ao',
} as const

type SlotKey = keyof typeof SUFFIXES
type PbrSlots = { [K in SlotKey]: THREE.Texture | null }

const RES = '1k'

const textureCache = new Map<string, THREE.Texture | null>()
const promiseCache = new Map<string, Promise<THREE.Texture | null>>()

const EMPTY_SLOTS: PbrSlots = {
  map: null,
  normalMap: null,
  roughnessMap: null,
  aoMap: null,
}

function loadTextureSafe(url: string): Promise<THREE.Texture | null> {
  if (textureCache.has(url)) return Promise.resolve(textureCache.get(url) ?? null)
  const existing = promiseCache.get(url)
  if (existing) return existing
  const loader = new THREE.TextureLoader()
  const p = new Promise<THREE.Texture | null>((resolve) => {
    loader.load(
      url,
      (t) => { textureCache.set(url, t); resolve(t) },
      undefined,
      () => {
        // eslint-disable-next-line no-console
        console.warn(`[wa] missing texture: ${url}`)
        textureCache.set(url, null)
        resolve(null)
      },
    )
  })
  promiseCache.set(url, p)
  return p
}

type Opts = { repeat?: [number, number]; anisotropy?: number }

/**
 * Loads a Poly Haven-style PBR set without suspending. Returns empty slots
 * synchronously so the mesh always mounts; updates via setState once textures
 * arrive. Missing maps remain null and the material falls back to its color
 * tint — a broken/missing asset can't blank out the scene.
 */
export function usePbrTexture(baseDir: string, slug: string, opts: Opts = {}): PbrSlots {
  const [slots, setSlots] = useState<PbrSlots>(EMPTY_SLOTS)

  useEffect(() => {
    let cancelled = false
    const entries = Object.entries(SUFFIXES) as Array<[SlotKey, string]>
    const urls = entries.map(([slot, suffix]) =>
      ({ slot, url: `${baseDir}/${slug}_${suffix}_${RES}.jpg` }),
    )
    Promise.all(urls.map(u => loadTextureSafe(u.url))).then((results) => {
      if (cancelled) return
      const next: PbrSlots = { map: null, normalMap: null, roughnessMap: null, aoMap: null }
      urls.forEach(({ slot }, i) => { next[slot] = results[i] })
      setSlots(next)
    })
    return () => { cancelled = true }
  }, [baseDir, slug])

  useEffect(() => {
    const aniso = opts.anisotropy ?? 4
    const rx = opts.repeat?.[0]
    const ry = opts.repeat?.[1]
    for (const key of Object.keys(slots) as SlotKey[]) {
      const t = slots[key]
      if (!t) continue
      t.wrapS = t.wrapT = THREE.RepeatWrapping
      if (rx !== undefined && ry !== undefined) t.repeat.set(rx, ry)
      t.anisotropy = aniso
      t.colorSpace = key === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace
      t.needsUpdate = true
    }
  }, [slots, opts.repeat?.[0], opts.repeat?.[1], opts.anisotropy])

  return slots
}
