import { Component, type ReactNode } from 'react'

interface State { error: Error | null }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#f87171', background: '#0a0a0f', minHeight: '100vh' }}>
          <h2 style={{ color: '#ef4444' }}>エラーが発生しました</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#ccc' }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
