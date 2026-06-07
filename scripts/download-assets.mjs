#!/usr/bin/env node
// Downloads Poly Haven assets (CC0) into public/assets.
// No auth required — public API at https://api.polyhaven.com.
//
// Usage:
//   node scripts/download-assets.mjs            # download all candidates
//   node scripts/download-assets.mjs --list     # just list what would be fetched
//   POLYHAVEN_RES=2k node scripts/download-assets.mjs  # bump resolution

import { mkdir, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'public', 'assets')
const RES = process.env.POLYHAVEN_RES || '1k'
const LIST_ONLY = process.argv.includes('--list')

// Curated candidates. Swap freely — anything that 404s is skipped with a note.
const TEXTURE_CANDIDATES = {
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
}

const HDRI_CANDIDATES = [
  'kloppenheim_06_puresky',
  'belfast_sunset_puresky',
  'kloofendal_48d_partly_cloudy_puresky',
  'sunset_in_the_chalk_quarry',
]

// Texture maps we want. Key = Poly Haven API key, suffix = filename slug.
const TEXTURE_MAPS = [
  { key: 'Diffuse', suffix: 'diff', required: true },
  { key: 'nor_gl',  suffix: 'nor_gl', required: false },
  { key: 'Rough',   suffix: 'rough', required: false },
  { key: 'AO',      suffix: 'ao', required: false },
]

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${url}`)
  return res.json()
}

async function fileExists(p) {
  try { await stat(p); return true } catch { return false }
}

async function downloadFile(url, dest) {
  if (await fileExists(dest)) {
    console.log(`  · cached ${path.basename(dest)}`)
    return
  }
  if (LIST_ONLY) {
    console.log(`  → ${path.basename(dest)}  ${url}`)
    return
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(path.dirname(dest), { recursive: true })
  await writeFile(dest, buf)
  const kb = (buf.length / 1024).toFixed(0)
  console.log(`  ↓ ${path.basename(dest)}  (${kb} KB)`)
}

// Prefer jpg, fall back to png, then anything else.
function pickFormat(formats) {
  if (!formats) return null
  if (formats.jpg) return { ext: 'jpg', url: formats.jpg.url }
  if (formats.png) return { ext: 'png', url: formats.png.url }
  const [ext, val] = Object.entries(formats)[0] ?? []
  return val?.url ? { ext, url: val.url } : null
}

async function downloadTexture(slug, outDir) {
  console.log(`\n[texture] ${slug}`)
  let files
  try {
    files = await fetchJson(`https://api.polyhaven.com/files/${slug}`)
  } catch (e) {
    console.log(`  ✗ skip (${e.message.split('\n')[0]})`)
    return
  }

  for (const map of TEXTURE_MAPS) {
    const entry = files[map.key]?.[RES]
    if (!entry) {
      console.log(`  - no ${map.key} at ${RES}${map.required ? ' (required!)' : ''}`)
      continue
    }
    const pick = pickFormat(entry)
    if (!pick) { console.log(`  - no usable format for ${map.key}`); continue }
    const dest = path.join(outDir, `${slug}_${map.suffix}_${RES}.${pick.ext}`)
    try {
      await downloadFile(pick.url, dest)
    } catch (e) {
      console.log(`  ✗ ${map.suffix}: ${e.message.split('\n')[0]}`)
    }
  }
}

async function downloadHdri(slug, outDir) {
  console.log(`\n[hdri] ${slug}`)
  let files
  try {
    files = await fetchJson(`https://api.polyhaven.com/files/${slug}`)
  } catch (e) {
    console.log(`  ✗ skip (${e.message.split('\n')[0]})`)
    return
  }
  const entry = files.hdri?.[RES]
  if (!entry) { console.log(`  - no hdri at ${RES}`); return }
  const fileUrl = entry.hdr?.url ?? entry.exr?.url
  const ext = entry.hdr ? 'hdr' : 'exr'
  if (!fileUrl) { console.log(`  - no hdr/exr file`); return }
  const dest = path.join(outDir, `${slug}_${RES}.${ext}`)
  try {
    await downloadFile(fileUrl, dest)
  } catch (e) {
    console.log(`  ✗ ${e.message.split('\n')[0]}`)
  }
}

async function main() {
  console.log(`Poly Haven asset download → ${path.relative(process.cwd(), OUT)}`)
  console.log(`Resolution: ${RES}  ·  mode: ${LIST_ONLY ? 'list' : 'download'}`)

  const textureDir = path.join(OUT, 'textures')
  const hdriDir = path.join(OUT, 'hdri')

  for (const [role, slugs] of Object.entries(TEXTURE_CANDIDATES)) {
    console.log(`\n── ${role} candidates ──`)
    for (const slug of slugs) await downloadTexture(slug, textureDir)
  }

  console.log(`\n── hdri candidates ──`)
  for (const slug of HDRI_CANDIDATES) await downloadHdri(slug, hdriDir)

  console.log(`\nDone.`)
  console.log(`Pick your defaults via the corner switcher in dev, or via ?ground=…&hedge=…&hdri=… URL params.`)
}

main().catch(e => { console.error(e); process.exit(1) })
