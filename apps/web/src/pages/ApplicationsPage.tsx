import { STATUS_LABELS, type Status } from '@applied/shared'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Board } from '../components/applications/Board'
import { Toolbar, type Filters, type View } from '../components/applications/Toolbar'
import { TableView } from '../components/applications/TableView'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { applicationsApi } from '../lib/api'

const defaultFilters: Filters = { sort: 'createdAt', order: 'desc' }

export function ApplicationsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debouncedQ, setDebouncedQ] = useState<string | undefined>()
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [view, setView] = useState<View>('board')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  // Wait for a pause in typing so each keystroke does not fire a request.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(search.trim() || undefined), 250)
    return () => clearTimeout(timer)
  }, [search])

  const { data, loading, error, retry, setData } = useAsync(
    () =>
      applicationsApi.list({
        q: debouncedQ,
        status: filters.status,
        jobType: filters.jobType,
        sort: filters.sort,
        order: filters.order,
      }),
    [debouncedQ, filters.status, filters.jobType, filters.sort, filters.order],
  )

  const applications = data?.applications ?? []
  const hasFilters =
    Boolean(search) ||
    Boolean(filters.status) ||
    Boolean(filters.jobType) ||
    filters.sort !== 'createdAt' ||
    filters.order !== 'desc'

  function clearFilters() {
    setSearch('')
    setDebouncedQ(undefined)
    setFilters(defaultFilters)
  }

  async function changeStatus(id: string, status: Status) {
    setActionError(null)
    setBusyId(id)
    try {
      const { application } = await applicationsApi.update(id, { status })
      setData({
        applications: applications.map((item) => (item.id === id ? application : item)),
      })
      // Moving columns remounts the card, which drops keyboard focus.
      requestAnimationFrame(() => {
        document.querySelector<HTMLSelectElement>(`[data-status-select="${id}"]`)?.focus()
      })
      setAnnouncement(`${application.company} moved to ${STATUS_LABELS[status]}.`)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not change status')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Every role you are tracking, in one place."
        actions={
          <Link
            to="/applications/new"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-medium text-white transition-colors hover:bg-primary-light"
          >
            New application
          </Link>
        }
      />

      <Toolbar
        search={search}
        onSearch={setSearch}
        filters={filters}
        onFilters={setFilters}
        view={view}
        onView={setView}
        onClear={clearFilters}
        hasFilters={hasFilters}
      />

      <p aria-live="polite" className="sr-only">{announcement}</p>

      {actionError && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-danger">
          {actionError}
        </p>
      )}

      {loading ? (
        <LoadingPanel label="Loading applications…" />
      ) : error ? (
        <ErrorPanel message={error.message} onRetry={retry} />
      ) : applications.length === 0 ? (
        hasFilters ? (
          <EmptyPanel
            title="No applications match these filters"
            message="Try a different search or clear the filters to see everything."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : (
          <EmptyPanel
            title="Your first application starts here"
            message="Add a company and a role now — you can fill in the rest later."
            actionLabel="Add an application"
            onAction={() => navigate('/applications/new')}
          />
        )
      ) : view === 'board' ? (
        <Board
          applications={applications}
          onStatusChange={changeStatus}
          busyId={busyId}
        />
      ) : (
        <TableView applications={applications} />
      )}
    </div>
  )
}
