import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; label?: string }
type State = { failed: boolean }

/**
 * Swallows render errors from a subtree (typically an HDRI/texture that 404s).
 * The rest of the scene keeps rendering instead of unmounting.
 */
export class SilentBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(err: Error) {
    // eslint-disable-next-line no-console
    console.warn(`[wa] ${this.props.label ?? 'subtree'} failed: ${err.message}`)
  }

  componentDidUpdate(prev: Props) {
    if (prev.children !== this.props.children && this.state.failed) {
      this.setState({ failed: false })
    }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
