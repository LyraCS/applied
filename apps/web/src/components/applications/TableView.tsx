import { STATUS_LABELS } from '@applied/shared'
import { Link } from 'react-router-dom'
import type { Application } from '../../lib/api'

const dateFormat = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

// Tables need more width than a phone has, so the wrapper scrolls sideways.
export function TableView({ applications }: { applications: Application[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Applications, sorted as selected</caption>
        <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Company</th>
            <th scope="col" className="px-4 py-3 font-semibold">Position</th>
            <th scope="col" className="px-4 py-3 font-semibold">Status</th>
            <th scope="col" className="px-4 py-3 font-semibold">Applied</th>
            <th scope="col" className="px-4 py-3 font-semibold">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {applications.map((application) => (
            <tr key={application.id} className="transition-colors hover:bg-surface/60">
              <td className="px-4 py-3">
                <Link
                  to={`/applications/${application.id}`}
                  className="min-h-11 rounded font-medium text-ink transition-colors hover:text-primary"
                >
                  {application.company}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted">{application.position}</td>
              <td className="px-4 py-3">
                <span className="rounded-full border border-line bg-surface px-2 py-1 text-xs text-ink">
                  {STATUS_LABELS[application.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-muted">
                {application.appliedAt ? dateFormat.format(new Date(application.appliedAt)) : '—'}
              </td>
              <td className="px-4 py-3 text-muted">{application.location ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
