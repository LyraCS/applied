// One set of loading / error / empty panels so no screen shows a blank box.
// role + aria-busy let assistive tech announce what is happening.

export function LoadingPanel({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-4">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((n) => (
        // Card-shaped skeleton matches the real layout, so nothing jumps on load.
        <div
          key={n}
          aria-hidden="true"
          className="rounded-xl border border-line bg-white p-4 shadow-sm"
        >
          <div className="h-4 w-1/3 rounded bg-line/70 motion-safe:animate-pulse" />
          <div className="mt-3 h-3 w-2/3 rounded bg-line/50 motion-safe:animate-pulse" />
          <div className="mt-2 h-3 w-1/2 rounded bg-line/50 motion-safe:animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/30 bg-red-50 p-6 text-center"
    >
      <p className="font-medium text-ink">We couldn’t load this.</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 min-h-11 rounded-md border border-primary px-4 font-medium text-primary transition-colors hover:bg-primary hover:text-white"
      >
        Try again
      </button>
    </div>
  )
}

export function EmptyPanel({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center">
      <p className="font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{message}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 min-h-11 rounded-md bg-primary px-5 font-medium text-white transition-colors hover:bg-primary-light"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
