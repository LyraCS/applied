import { STATUSES, STATUS_LABELS, type Status } from '@applied/shared'
import type { Application } from '../../lib/api'
import { ApplicationCard } from './ApplicationCard'

// Mobile: stacked status groups (a list, not a sideways scroll).
// md/lg: the same groups become board columns.
export function Board({
  applications,
  onStatusChange,
  busyId,
}: {
  applications: Application[]
  onStatusChange: (id: string, status: Status) => void
  busyId: string | null
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {STATUSES.map((status) => {
        const items = applications.filter((application) => application.status === status)
        return (
          <section
            key={status}
            aria-labelledby={`column-${status}`}
            className="rounded-xl border border-line bg-white/60 p-3"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2
                id={`column-${status}`}
                className="text-xs font-semibold uppercase tracking-wider text-muted"
              >
                {STATUS_LABELS[status]}
              </h2>
              <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                {items.length}
              </span>
            </div>
            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">
                  Nothing here yet
                </p>
              ) : (
                items.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onStatusChange={onStatusChange}
                    busy={busyId === application.id}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
