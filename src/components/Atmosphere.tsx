import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

type Props = {
  color: string
  fogNear: number
  fogFar: number
}

/**
 * Sets scene.background and scene.fog imperatively. Equivalent to using
 * <color attach="background"> / <fog attach="fog"> but avoids any JSX
 * primitive registration issues across drei / R3F versions.
 */
export function Atmosphere({ color, fogNear, fogFar }: Props) {
  const { scene } = useThree()

  useEffect(() => {
    const c = new THREE.Color(color)
    const prevBg = scene.background
    const prevFog = scene.fog
    scene.background = c
    scene.fog = new THREE.Fog(c, fogNear, fogFar)
    return () => {
      scene.background = prevBg
      scene.fog = prevFog
    }
  }, [scene, color, fogNear, fogFar])

  return null
}
