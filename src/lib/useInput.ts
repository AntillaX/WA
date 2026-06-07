import { useEffect, useRef } from 'react'

export type InputState = {
  forward: number   // -1..1
  strafe: number    // -1..1
  lookDX: number    // accumulated since last read (px)
  lookDY: number
  touchActive: boolean
  consumeLook(): { dx: number; dy: number }
}

export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' &&
    ('ontouchstart' in window || (navigator as any).maxTouchPoints > 0)
}

export function useInput(): InputState {
  const stateRef = useRef<InputState>({
    forward: 0,
    strafe: 0,
    lookDX: 0,
    lookDY: 0,
    touchActive: false,
    consumeLook() {
      const dx = this.lookDX, dy = this.lookDY
      this.lookDX = 0; this.lookDY = 0
      return { dx, dy }
    },
  })

  const keysRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    const handleKey = (down: boolean) => (e: KeyboardEvent) => {
      keysRef.current[e.code] = down
      const k = keysRef.current
      const s = stateRef.current
      // keyboard overrides touch joystick when keys are pressed
      const fwd = (k['KeyW'] || k['ArrowUp'] ? 1 : 0) - (k['KeyS'] || k['ArrowDown'] ? 1 : 0)
      const str = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0)
      if (fwd !== 0 || str !== 0 || (!down && !s.touchActive)) {
        s.forward = fwd
        s.strafe = str
      }
    }
    const onDown = handleKey(true)
    const onUp = handleKey(false)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  return stateRef.current
}
