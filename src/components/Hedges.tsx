import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { usePbrTexture } from '../lib/usePbrTexture'

type Props = {
  slug: string
  width: number
  depth: number
  wallHeight: number
  wallThickness: number
  gap: number
}

export function Hedges({ slug, width, depth, wallHeight, wallThickness, gap }: Props) {
  const tex = usePbrTexture('/assets/textures', slug, { repeat: [4, 2] })

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#5e6b4a'),
    roughness: 0.95,
    metalness: 0,
    normalScale: new THREE.Vector2(1.1, 1.1),
  }), [])

  useEffect(() => {
    material.map = tex.map
    material.normalMap = tex.normalMap
    material.roughnessMap = tex.roughnessMap
    material.aoMap = tex.aoMap
    material.needsUpdate = true
  }, [material, tex.map, tex.normalMap, tex.roughnessMap, tex.aoMap])

  useEffect(() => () => material.dispose(), [material])

  const sideHalf = (width - gap) / 2

  return (
    <group>
      {/* Left wall */}
      <mesh
        position={[-width / 2, wallHeight / 2, -depth / 2]}
        castShadow
        receiveShadow
        material={material}
      >
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
      </mesh>

      {/* Right wall */}
      <mesh
        position={[width / 2, wallHeight / 2, -depth / 2]}
        castShadow
        receiveShadow
        material={material}
      >
        <boxGeometry args={[wallThickness, wallHeight, depth]} />
      </mesh>

      {/* Far wall — left half of split */}
      <mesh
        position={[-(gap / 2 + sideHalf / 2), wallHeight / 2, -depth]}
        castShadow
        receiveShadow
        material={material}
      >
        <boxGeometry args={[sideHalf, wallHeight, wallThickness]} />
      </mesh>

      {/* Far wall — right half of split */}
      <mesh
        position={[gap / 2 + sideHalf / 2, wallHeight / 2, -depth]}
        castShadow
        receiveShadow
        material={material}
      >
        <boxGeometry args={[sideHalf, wallHeight, wallThickness]} />
      </mesh>

      {/* Darkness pocket behind the gap: an inward-facing black box so peeking
          through reveals deep black, not fog. fog={false} keeps it pitch dark. */}
      <mesh position={[0, wallHeight / 2, -depth - 4]}>
        <boxGeometry args={[gap + 1.2, wallHeight + 2, 8]} />
        <meshBasicMaterial color="#000000" side={THREE.BackSide} fog={false} />
      </mesh>

      {/* Sliver of dim ground extending into the gap — keeps it readable as a path */}
      <mesh
        position={[0, 0.002, -depth - 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[gap - 0.1, 2]} />
        <meshBasicMaterial color="#070808" fog={false} />
      </mesh>
    </group>
  )
}
