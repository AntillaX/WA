// Lists of downloadable Poly Haven candidates and the active selection.
// Swap defaults here, or use the corner UI / URL params (?ground=…&hedge=…&hdri=…).

export const CANDIDATES = {
  ground: [
    'aerial_grass_rock',
    'forest_ground_01',
    'leafy_grass',
    'brown_mud_03',
  ],
  hedge: [
    'forest_leaves_03',
    'large_leaf_plant',
    'green_wall',
  ],
  hdri: [
    'kloppenheim_06_puresky',
    'belfast_sunset_puresky',
    'kloofendal_48d_partly_cloudy_puresky',
    'sunset_in_the_chalk_quarry',
  ],
} as const

export type AssetKind = keyof typeof CANDIDATES

export const DEFAULTS = {
  ground: 'aerial_grass_rock',
  hedge: 'forest_leaves_03',
  hdri: 'kloppenheim_06_puresky',
} satisfies Record<AssetKind, string>

export type AssetConfig = Record<AssetKind, string>

export function readConfigFromUrl(): AssetConfig {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  const params = new URLSearchParams(window.location.search)
  const pick = (k: AssetKind) => {
    const v = params.get(k)
    return v && (CANDIDATES[k] as readonly string[]).includes(v) ? v : DEFAULTS[k]
  }
  return { ground: pick('ground'), hedge: pick('hedge'), hdri: pick('hdri') }
}

export function writeConfigToUrl(cfg: AssetConfig) {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  for (const k of Object.keys(cfg) as AssetKind[]) url.searchParams.set(k, cfg[k])
  window.history.replaceState(null, '', url)
}
