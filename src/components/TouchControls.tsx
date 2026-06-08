import { useEffect, useRef } from 'react'
import type { InputState } from '../lib/useInput'

type Props = { input: InputState; visible: boolean }

const JOYSTICK_RADIUS = 56

export function TouchControls({ input, visible }: Props) {
  const joyRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const joyState = useRef({ active: false, id: -1, cx: 0, cy: 0 })
  const lookState = useRef({ active: false, id: -1, x: 0, y: 0 })

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        const isLeft = t.clientX < window.innerWidth / 2
        if (isLeft && !joyState.current.active) {
          joyState.current = { active: true, id: t.identifier, cx: t.clientX, cy: t.clientY }
          input.touchActive = true
          if (joyRef.current) {
            joyRef.current.style.left = `${t.clientX - JOYSTICK_RADIUS}px`
            joyRef.current.style.top = `${t.clientY - JOYSTICK_RADIUS}px`
            joyRef.current.style.opacity = '1'
          }
          if (knobRef.current) {
            knobRef.current.style.transform = 'translate(0px, 0px)'
          }
        } else if (!isLeft && !lookState.current.active) {
          lookState.current = { active: true, id: t.identifier, x: t.clientX, y: t.clientY }
        }
      }
    }

    const onMove = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyState.current.id) {
          const dx = t.clientX - joyState.current.cx
          const dy = t.clientY - joyState.current.cy
          const dist = Math.min(Math.hypot(dx, dy), JOYSTICK_RADIUS)
          const angle = Math.atan2(dy, dx)
          const kx = Math.cos(angle) * dist
          const ky = Math.sin(angle) * dist
          if (knobRef.current) knobRef.current.style.transform = `translate(${kx}px, ${ky}px)`
          // Map to -1..1 with small deadzone
          const dead = 0.12
          const nx = kx / JOYSTICK_RADIUS
          const ny = ky / JOYSTICK_RADIUS
          input.strafe = Math.abs(nx) < dead ? 0 : nx
          input.forward = Math.abs(ny) < dead ? 0 : -ny
        } else if (t.identifier === lookState.current.id) {
          input.lookDX += t.clientX - lookState.current.x
          input.lookDY += t.clientY - lookState.current.y
          lookState.current.x = t.clientX
          lookState.current.y = t.clientY
        }
      }
      e.preventDefault()
    }

    const onEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === joyState.current.id) {
          joyState.current.active = false
          joyState.current.id = -1
          input.forward = 0
          input.strafe = 0
          input.touchActive = false
          if (joyRef.current) joyRef.current.style.opacity = '0'
        } else if (t.identifier === lookState.current.id) {
          lookState.current.active = false
          lookState.current.id = -1
        }
      }
    }

    window.addEventListener('touchstart', onStart, { passive: false })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [input])

  if (!visible) return null

  return (
    <div
      ref={joyRef}
      style={{
        position: 'fixed',
        width: JOYSTICK_RADIUS * 2,
        height: JOYSTICK_RADIUS * 2,
        borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.18)',
        background: 'rgba(0,0,0,0.18)',
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity 0.15s ease',
        zIndex: 7,
      }}
    >
      <div
        ref={knobRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 40,
          height: 40,
          marginLeft: -20,
          marginTop: -20,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.32)',
          transform: 'translate(0px, 0px)',
        }}
      />
    </div>
  )
}
