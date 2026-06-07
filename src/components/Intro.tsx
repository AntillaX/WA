import { isTouchDevice } from '../lib/useInput'

export function Intro({ onDismiss }: { onDismiss: () => void }) {
  const touch = isTouchDevice()

  return (
    <div className="intro" onClick={onDismiss} onTouchEnd={onDismiss}>
      <div className="intro__card">
        <h1 className="intro__title">Waiting Area</h1>
        {touch ? (
          <>
            <p className="intro__line">Drag left to move.</p>
            <p className="intro__line">Drag right to look.</p>
            <p className="intro__hint">Tap to enter.</p>
          </>
        ) : (
          <>
            <p className="intro__line">WASD to move. Mouse to look.</p>
            <p className="intro__hint">Click to enter · Esc to release</p>
          </>
        )}
      </div>
    </div>
  )
}
