import { STATUS_LABELS, type Status } from '@applied/shared'
import { Link } from 'react-router-dom'
import type { Application } from '../../lib/api'

const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

export function ApplicationCard({
  application,
  onStatusChange,
  busy,
}: {
  application: Application
  onStatusChange: (id: string, status: Status) => void
  busy: boolean
}) {
  return (
    <article className="rounded-xl border border-line bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/applications/${application.id}`}
          className="min-h-11 rounded font-semibold text-ink transition-colors hover:text-primary"
        >
          {application.company}
        </Link>
        {application.jobType && (
          <span className="shrink-0 rounded-full border border-line bg-surface px-2 py-1 text-xs text-muted">
            {application.jobType.replace('_', ' ').toLowerCase()}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{application.position}</p>

      <dl className="mt-3 space-y-1 text-sm text-muted">
        <div className="flex justify-between gap-2">
          <dt>Applied</dt>
          <dd className="text-right text-ink">
            {application.appliedAt ? dateFormat.format(new Date(application.appliedAt)) : '—'}
          </dd>
        </div>
        {application.location && (
          <div className="flex justify-between gap-2">
            <dt>Location</dt>
            <dd className="truncate text-right text-ink">{application.location}</dd>
          </div>
        )}
      </dl>

      {/* A native select is keyboard-operable and works with mobile pickers. */}
      <div className="mt-4 border-t border-line pt-3">
        <select
          data-status-select={application.id}
          aria-label={`Status for ${application.company}`}
          value={application.status}
          disabled={busy}
          onChange={(event) => onStatusChange(application.id, event.target.value as Status)}
          className="min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink transition-colors hover:border-primary disabled:opacity-60"
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </article>
  )
}
