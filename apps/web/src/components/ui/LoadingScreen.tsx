export function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-muted">
        <span
          className="h-5 w-5 rounded-full border-2 border-line border-t-primary motion-safe:animate-spin"
          aria-hidden="true"
        />
        <span>{label}</span>
      </div>
    </div>
  )
}
