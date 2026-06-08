import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { isTouchDevice, type InputState } from '../lib/useInput'

type Props = {
  width: number
  depth: number
  wallThickness: number
  gap: number
  backLimit: number
  input: InputState
}

const SPEED = 3.2
const EYE_HEIGHT = 1.65
const RADIUS = 0.35

export function Player({ width, depth, wallThickness, gap, backLimit, input }: Props) {
  const { camera } = useThree()
  const velocity = useRef(new THREE.Vector3())
  const tmpDir = useRef(new THREE.Vector3())
  const tmpRight = useRef(new THREE.Vector3())
  const tmpMove = useRef(new THREE.Vector3())
  const yaw = useRef(0)
  const pitch = useRef(0)
  const touch = useRef(isTouchDevice())

  useEffect(() => {
    camera.position.set(0, EYE_HEIGHT, 6)
    camera.lookAt(0, EYE_HEIGHT, -1)
    yaw.current = camera.rotation.y
    pitch.current = camera.rotation.x
  }, [camera])

  useFrame((_, dt) => {
    // Touch: apply accumulated look deltas to camera euler
    if (touch.current) {
      const { dx, dy } = input.consumeLook()
      if (dx !== 0 || dy !== 0) {
        yaw.current -= dx * 0.0035
        pitch.current -= dy * 0.0035
        pitch.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, pitch.current))
        camera.rotation.order = 'YXZ'
        camera.rotation.y = yaw.current
        camera.rotation.x = pitch.current
      }
    }

    const fwd = input.forward
    const str = input.strafe

    if (fwd === 0 && str === 0) {
      velocity.current.multiplyScalar(0.82)
    } else {
      camera.getWorldDirection(tmpDir.current)
      tmpDir.current.y = 0
      tmpDir.current.normalize()
      tmpRight.current.crossVectors(tmpDir.current, camera.up).normalize()

      tmpMove.current.set(0, 0, 0)
        .addScaledVector(tmpDir.current, fwd)
        .addScaledVector(tmpRight.current, str)
      if (tmpMove.current.lengthSq() > 0) tmpMove.current.normalize()
      tmpMove.current.multiplyScalar(SPEED)

      velocity.current.lerp(tmpMove.current, 0.22)
    }

    const next = camera.position.clone().addScaledVector(velocity.current, dt)

    // collisions
    const halfW = width / 2 - wallThickness / 2 - RADIUS
    next.x = THREE.MathUtils.clamp(next.x, -halfW, halfW)

    const xInGap = Math.abs(next.x) <= gap / 2 - RADIUS
    const farBlocked = -depth + wallThickness / 2 + RADIUS
    const farPocket = -depth - 1.5
    const minZ = xInGap ? farPocket : farBlocked
    next.z = Math.max(next.z, minZ)
    next.z = Math.min(next.z, backLimit)

    next.y = EYE_HEIGHT

    camera.position.copy(next)
  })

  if (touch.current) return null
  return <PointerLockControls />
}
