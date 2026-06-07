# Waiting Area

A small atmospheric 3D scene — a hedged-in outdoor enclosure at late evening, with a dark opening in the far hedge wall. Built with React Three Fiber + Drei on a WebGPU renderer (WebGL2 fallback). Intended as a sandbox for art-direction iteration, not as a game.

## Run it

```bash
npm install
npm run assets   # downloads candidate textures + HDRIs from Poly Haven (CC0)
npm run dev      # http://localhost:5173
```

The asset download is one-time (~30–60 MB at 1k). On subsequent runs it skips files already on disk.

For higher fidelity: `POLYHAVEN_RES=2k npm run assets` (costs more memory and download time).

## Picking assets

Three slots — `ground`, `hedge`, `hdri` — each with a few CC0 candidates. Switch at runtime via:

- The dropdown in the top-right corner of the scene.
- URL params: `?ground=forest_ground_01&hedge=large_leaf_plant&hdri=belfast_sunset_puresky`.
- Or edit `src/config.ts` for permanent defaults.

The candidate lists live in `src/config.ts` (UI) and `scripts/download-assets.mjs` (downloader). Add a Poly Haven slug to both and re-run `npm run assets` to pull it in.

## Controls

- **Desktop:** click to lock pointer, WASD / arrows to move, mouse to look, Esc to release.
- **Touch:** tap to enter, drag left half to move, drag right half to look.
- The hedge walls confine you. The gap in the far wall lets you step a short way into darkness (the maze entrance — nothing built behind it yet).

## Renderer

Tries WebGPU first via `three/webgpu`, falls back to WebGL2 silently. Active backend is shown bottom-left. Force WebGL2 with `?renderer=webgl` (useful for parity testing).

## Performance

- 1k textures and HDRI by default.
- Single directional shadow caster, 2048² shadow map.
- DPR capped at 1.5 on touch devices, 2 on desktop.
- Suspense + per-asset error boundaries: a missing file degrades to flat colors instead of crashing the scene.

## File map

```
src/
  App.tsx              renderer creation + UI shell
  components/
    Scene.tsx          composes ground, hedges, lights, fog, environment
    Ground.tsx         large textured plane
    Hedges.tsx         four box walls + darkness pocket behind the gap
    Player.tsx         WASD / touch movement with wall collision
    TouchControls.tsx  virtual joystick + drag-look surface (mobile only)
    Intro.tsx          click-to-start overlay
    AssetSwitcher.tsx  corner dropdown
    SilentBoundary.tsx error-boundary that swallows asset failures
  lib/
    createRenderer.ts  WebGPU with WebGL2 fallback
    usePbrTexture.ts   suspense-friendly PBR-set loader (404-tolerant)
    useInput.ts        keyboard + touch input state
  config.ts            candidate lists, defaults, URL-param plumbing
scripts/
  download-assets.mjs  Poly Haven asset downloader
public/assets/         textures/ and hdri/ (gitignored, populated by the script)
```

## What's intentionally missing

- No real maze behind the gap — it's a black pocket.
- No NPCs, props, or interactables.
- No audio. The scene is "still" by design.

## Notes on the look

- Fog color matches background (`#0c1015`), so the open back fades naturally into the sky.
- The "darkness pocket" behind the gap has `fog={false}`, so it reads as deep black rather than haze — keeps the maze entrance ominous.
- Directional light tinted warm amber, hemisphere fill cool blue — splits the scene into warm-side / cold-side, characteristic of late evening.
- Tone mapping: ACES Filmic, exposure 0.82.
