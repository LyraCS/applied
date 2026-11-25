import { STATUS_LABELS, JOB_TYPE_LABELS } from '@applied/shared'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { ApiError, applicationsApi } from '../lib/api'

const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="break-words text-sm text-ink">{children}</dd>
    </div>
  )
}

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, loading, error, retry } = useAsync(() => applicationsApi.get(id!), [id])
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
  }, [confirming])

  async function remove() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await applicationsApi.remove(id!)
      navigate('/applications')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete this application')
      setDeleting(false)
    }
  }

  if (loading) return <LoadingPanel label="Loading application…" />
  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <EmptyPanel
        title="Application not found"
        message="It may have been deleted or belong to another account."
        actionLabel="Back to applications"
        onAction={() => navigate('/applications')}
      />
    ) : (
      <ErrorPanel message={error.message} onRetry={retry} />
    )
  }

  const application = data!.application

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/applications" className="text-sm font-medium text-primary hover:underline">
            ← All applications
          </Link>
          <h1 className="mt-3 text-2xl font-semibold text-ink sm:text-3xl">
            {application.company}
          </h1>
          <p className="mt-1 text-muted">{application.position}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/applications/${id}/edit`}
            className="inline-flex min-h-11 items-center rounded-md border border-line px-4 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={confirming}
            className="inline-flex min-h-11 items-center rounded-md border border-danger/40 px-4 font-medium text-danger transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>
        </div>
      </header>

      {deleteError && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-danger">
          {deleteError}
        </p>
      )}

      {confirming && (
        <div
          role="group"
          aria-label="Confirm deletion"
          className="rounded-md border border-danger/30 bg-red-50 p-4"
        >
          <p className="font-medium text-ink">Delete this application?</p>
          <p className="mt-1 text-sm text-muted">This cannot be undone.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-md border border-line bg-white px-5 font-medium text-ink transition-colors hover:border-primary"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={() => void remove()}
              disabled={deleting}
              className="min-h-11 rounded-md bg-danger px-5 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
          </div>
        </div>
      )}

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <h2 className="sr-only">Application details</h2>
        <dl>
          <Row label="Status">{STATUS_LABELS[application.status]}</Row>
          <Row label="Applied">
            {application.appliedAt ? dateFormat.format(new Date(application.appliedAt)) : '—'}
          </Row>
          <Row label="Job type">
            {application.jobType ? JOB_TYPE_LABELS[application.jobType] : '—'}
          </Row>
          <Row label="Location">{application.location ?? '—'}</Row>
          <Row label="Salary">{application.salary ?? '—'}</Row>
          <Row label="Hiring contact">{application.hiringContact ?? '—'}</Row>
          <Row label="Posting">
            {application.portalUrl ? (
              <a
                href={application.portalUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center text-primary hover:underline"
              >
                Open job posting
              </a>
            ) : (
              '—'
            )}
          </Row>
          <Row label="Description">
            <span className="whitespace-pre-wrap">{application.jobDescription ?? '—'}</span>
          </Row>
          <Row label="Qualifications">
            <span className="whitespace-pre-wrap">{application.qualifications ?? '—'}</span>
          </Row>
          <Row label="Notes">
            <span className="whitespace-pre-wrap">{application.notes ?? '—'}</span>
          </Row>
        </dl>
      </section>
    </div>
  )
}
