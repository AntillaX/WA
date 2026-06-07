import { Component, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  label?: string
  /** When true, errors are re-thrown after logging (useful at the top of the tree). */
  rethrow?: boolean
}
type State = { failed: boolean; message?: string }

/**
 * Swallows render errors from a subtree (typically an HDRI/texture that 404s).
 * The rest of the scene keeps rendering instead of unmounting.
 *
 * When `rethrow` is set, the boundary logs the error loudly and lets it
 * propagate — useful for a top-level boundary that should surface root causes
 * rather than hide them.
 */
export class SilentBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(err: Error): State {
    return { failed: true, message: err.message }
  }

  componentDidCatch(err: Error) {
    // eslint-disable-next-line no-console
    console.error(`[wa] ${this.props.label ?? 'subtree'} failed:`, err)
  }

  componentDidUpdate(prev: Props) {
    if (prev.children !== this.props.children && this.state.failed) {
      this.setState({ failed: false, message: undefined })
    }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
