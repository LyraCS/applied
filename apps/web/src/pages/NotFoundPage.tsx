import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-xl rounded-xl border border-line bg-white p-8 text-center shadow-sm">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">We can’t find that page</h1>
      <p className="mx-auto mt-3 max-w-sm text-muted">
        The link may be old, or the page may have moved.
      </p>
      <Link
        to="/applications"
        className="mt-6 inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-medium text-white transition-colors hover:bg-primary-light"
      >
        Back to applications
      </Link>
    </section>
  )
}
