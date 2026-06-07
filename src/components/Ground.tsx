import { useMemo } from 'react'
import * as THREE from 'three'
import { usePbrTexture } from '../lib/usePbrTexture'

type Props = { slug: string; width: number; depth: number }

export function Ground({ slug, width, depth }: Props) {
  const tex = usePbrTexture('/assets/textures', slug, { repeat: [10, 10] })

  // Subtle ground tint to take some saturation out and warm it slightly.
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    map: tex.map ?? undefined,
    normalMap: tex.normalMap ?? undefined,
    roughnessMap: tex.roughnessMap ?? undefined,
    aoMap: tex.aoMap ?? undefined,
    roughness: 1,
    metalness: 0,
    color: new THREE.Color('#9a948a'),
    normalScale: new THREE.Vector2(0.8, 0.8),
  }), [tex])

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      material={material}
    >
      <planeGeometry args={[width, depth, 1, 1]} />
    </mesh>
  )
}
