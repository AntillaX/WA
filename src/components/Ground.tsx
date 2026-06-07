import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { usePbrTexture } from '../lib/usePbrTexture'

type Props = { slug: string; width: number; depth: number }

export function Ground({ slug, width, depth }: Props) {
  const tex = usePbrTexture('/assets/textures', slug, { repeat: [10, 10] })

  // Built once. Properties are mutated below as textures arrive — avoids
  // passing `undefined` into the constructor (which three.js warns about).
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#9a948a'),
    roughness: 1,
    metalness: 0,
    normalScale: new THREE.Vector2(0.8, 0.8),
  }), [])

  useEffect(() => {
    material.map = tex.map
    material.normalMap = tex.normalMap
    material.roughnessMap = tex.roughnessMap
    material.aoMap = tex.aoMap
    material.needsUpdate = true
  }, [material, tex.map, tex.normalMap, tex.roughnessMap, tex.aoMap])

  useEffect(() => () => material.dispose(), [material])

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
