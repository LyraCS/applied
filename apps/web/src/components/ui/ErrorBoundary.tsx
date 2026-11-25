import { Component, type ErrorInfo, type ReactNode } from 'react'

type State = { error: Error | null }

// React only catches render errors through a class component. Without this,
// one broken screen unmounts the whole app and leaves a blank page.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Something broke</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">This screen couldn’t load</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Your applications are safe. Reload the page, or head back to your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-11 rounded-md bg-primary px-5 font-medium text-white transition-colors hover:bg-primary-light"
          >
            Reload page
          </button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center rounded-md border border-line px-5 text-muted transition-colors hover:border-primary hover:text-primary"
          >
            Back to dashboard
          </a>
        </div>
      </main>
    )
  }
}
