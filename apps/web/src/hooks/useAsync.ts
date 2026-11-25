import { useEffect, useState } from 'react'

type AsyncState<T> = { data: T | null; loading: boolean; error: Error | null }

// Each screen fetches what it needs from the API; there is no global store.
// `deps` lists the real inputs that should trigger a fetch. `retry` re-runs
// the same load function after an error, and `setData` updates a row locally.
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setState({ data: null, loading: true, error: null })
    load()
      .then((data) => {
        if (active) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (active) {
          setState({
            data: null,
            loading: false,
            error:
              err instanceof Error
                ? err
                : new Error('Something went wrong. Please try again.'),
          })
        }
      })
    return () => {
      active = false
    }
    // `load` is a fresh function each render; deps describe the actual inputs.
  }, [...deps, attempt])

  return {
    ...state,
    retry: () => setAttempt((n) => n + 1),
    setData: (data: T) => setState((current) => ({ ...current, data })),
  }
}
