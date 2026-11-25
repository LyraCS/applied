import {
  JOB_TYPES,
  JOB_TYPE_LABELS,
  SORT_FIELDS,
  STATUSES,
  STATUS_LABELS,
  type JobType,
  type Status,
} from '@applied/shared'
import type { ApplicationQueryParams } from '../../lib/api'

export type Filters = {
  status?: Status
  jobType?: JobType
  sort: NonNullable<ApplicationQueryParams['sort']>
  order: NonNullable<ApplicationQueryParams['order']>
}

export type View = 'board' | 'table'

const SORT_LABELS = {
  createdAt: 'Recently added',
  appliedAt: 'Applied date',
  company: 'Company name',
} as const

const selectClass =
  'mt-1 min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink transition-colors hover:border-primary'

function toValue(value: string) {
  return value === '' ? undefined : value
}

export function Toolbar({
  search,
  onSearch,
  filters,
  onFilters,
  view,
  onView,
  onClear,
  hasFilters,
}: {
  search: string
  onSearch: (value: string) => void
  filters: Filters
  onFilters: (next: Filters) => void
  view: View
  onView: (next: View) => void
  onClear: () => void
  hasFilters: boolean
}) {
  return (
    <section aria-label="Search and filter applications" className="rounded-xl border border-line bg-white p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-2">
          <label htmlFor="search" className="text-xs font-semibold uppercase tracking-wider text-muted">
            Search
          </label>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Company, role or location"
            aria-describedby="search-hint"
            className={selectClass}
          />
          <p id="search-hint" className="mt-1 text-xs text-muted">
            Matches company, position and location.
          </p>
        </div>

        <div>
          <label htmlFor="filter-status" className="text-xs font-semibold uppercase tracking-wider text-muted">
            Status
          </label>
          <select
            id="filter-status"
            className={selectClass}
            value={filters.status ?? ''}
            onChange={(event) =>
              onFilters({ ...filters, status: toValue(event.target.value) as Status | undefined })
            }
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-job-type" className="text-xs font-semibold uppercase tracking-wider text-muted">
            Job type
          </label>
          <select
            id="filter-job-type"
            className={selectClass}
            value={filters.jobType ?? ''}
            onChange={(event) =>
              onFilters({ ...filters, jobType: toValue(event.target.value) as JobType | undefined })
            }
          >
            <option value="">All types</option>
            {JOB_TYPES.map((jobType) => (
              <option key={jobType} value={jobType}>{JOB_TYPE_LABELS[jobType]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-wider text-muted">
            Sort by
          </label>
          <select
            id="sort"
            className={selectClass}
            value={filters.sort}
            onChange={(event) =>
              onFilters({
                ...filters,
                sort: event.target.value as NonNullable<ApplicationQueryParams['sort']>,
              })
            }
          >
            {SORT_FIELDS.map((field) => (
              <option key={field} value={field}>{SORT_LABELS[field]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Sort ascending"
            aria-pressed={filters.order === 'asc'}
            onClick={() => onFilters({ ...filters, order: 'asc' })}
            className={`min-h-11 rounded-md border px-4 text-sm transition-colors ${
              filters.order === 'asc'
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-white text-muted hover:border-primary hover:text-primary'
            }`}
          >
            A–Z / oldest
          </button>
          <button
            type="button"
            aria-label="Sort descending"
            aria-pressed={filters.order === 'desc'}
            onClick={() => onFilters({ ...filters, order: 'desc' })}
            className={`min-h-11 rounded-md border px-4 text-sm transition-colors ${
              filters.order === 'desc'
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-white text-muted hover:border-primary hover:text-primary'
            }`}
          >
            Z–A / newest
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={onClear}
              className="min-h-11 rounded-md px-3 text-sm text-muted transition-colors hover:text-primary"
            >
              Clear filters
            </button>
          )}
          <div role="group" aria-label="View" className="flex rounded-md border border-line p-1">
            {(['board', 'table'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => onView(option)}
                className={`min-h-11 rounded px-4 text-sm font-medium capitalize transition-colors ${
                  view === option ? 'bg-primary text-white' : 'text-muted hover:text-primary'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
