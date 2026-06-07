import { Suspense } from 'react'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import { Ground } from './Ground'
import { Hedges } from './Hedges'
import { Player } from './Player'
import { SilentBoundary } from './SilentBoundary'
import type { AssetConfig } from '../config'
import type { InputState } from '../lib/useInput'

export const ENCLOSURE = {
  width: 24,
  depth: 20,
  wallHeight: 4.5,
  wallThickness: 0.5,
  gap: 3,
  backLimit: 8,
}

type Props = { config: AssetConfig; input: InputState }

export function Scene({ config, input }: Props) {
  const fogColor = new THREE.Color('#0c1015')

  return (
    <>
      <color attach="background" args={[fogColor.getHex()]} />
      <fog attach="fog" args={[fogColor.getHex(), 9, 32]} />

      {/* HDRI environment — isolated so a missing file doesn't kill the scene */}
      <SilentBoundary label={`HDRI ${config.hdri}`}>
        <Suspense fallback={null}>
          <Environment
            files={`/assets/hdri/${config.hdri}_1k.hdr`}
            background={false}
            environmentIntensity={0.35}
          />
        </Suspense>
      </SilentBoundary>

      {/* Late-evening warm sun, low and from one side */}
      <directionalLight
        position={[-7, 4.5, -8]}
        intensity={2.0}
        color="#ffa766"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={0.5}
        shadow-camera-far={45}
        shadow-bias={-0.0005}
        shadow-normalBias={0.04}
      />

      {/* Cool sky-fill for the side opposite the sun */}
      <hemisphereLight args={['#3a4258', '#1a1c20', 0.18]} />

      {/* Geometry — its own suspense so HDRI load delays don't block it */}
      <SilentBoundary label="ground">
        <Suspense fallback={null}>
          <Ground
            slug={config.ground}
            width={ENCLOSURE.width + 24}
            depth={ENCLOSURE.depth + 40}
          />
        </Suspense>
      </SilentBoundary>

      <SilentBoundary label="hedges">
        <Suspense fallback={null}>
          <Hedges slug={config.hedge} {...ENCLOSURE} />
        </Suspense>
      </SilentBoundary>

      <Player {...ENCLOSURE} input={input} />
    </>
  )
}
