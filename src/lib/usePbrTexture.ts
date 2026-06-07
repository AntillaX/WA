import { useEffect } from 'react'
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
const texturePromiseCache = new Map<string, Promise<THREE.Texture | null>>()
const bundleCache = new Map<string, PbrSlots>()
const bundlePromiseCache = new Map<string, Promise<PbrSlots>>()

function loadTextureSafe(url: string): Promise<THREE.Texture | null> {
  if (textureCache.has(url)) return Promise.resolve(textureCache.get(url) ?? null)
  const existing = texturePromiseCache.get(url)
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
  texturePromiseCache.set(url, p)
  return p
}

type Opts = { repeat?: [number, number]; anisotropy?: number }

/**
 * Loads a Poly Haven-style PBR set as {map, normalMap, roughnessMap, aoMap}.
 * Suspends until every file has either loaded or failed; failures resolve to
 * null instead of rejecting, so a missing AO map doesn't break the material.
 */
export function usePbrTexture(baseDir: string, slug: string, opts: Opts = {}): PbrSlots {
  const bundleKey = `${baseDir}|${slug}|${RES}`

  if (!bundleCache.has(bundleKey)) {
    let bp = bundlePromiseCache.get(bundleKey)
    if (!bp) {
      const entries = Object.entries(SUFFIXES) as Array<[SlotKey, string]>
      const urls = entries.map(([slot, suffix]) =>
        ({ slot, url: `${baseDir}/${slug}_${suffix}_${RES}.jpg` }),
      )
      bp = Promise.all(urls.map(u => loadTextureSafe(u.url))).then((results) => {
        const out: PbrSlots = { map: null, normalMap: null, roughnessMap: null, aoMap: null }
        urls.forEach(({ slot }, i) => { out[slot] = results[i] })
        bundleCache.set(bundleKey, out)
        return out
      })
      bundlePromiseCache.set(bundleKey, bp)
    }
    throw bp
  }

  const slots = bundleCache.get(bundleKey)!

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
