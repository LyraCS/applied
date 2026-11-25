import { STATUS_LABELS } from '@applied/shared'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '../components/ui/States'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { applicationsApi, getStats } from '../lib/api'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, retry } = useAsync(async () => {
    const [stats, list] = await Promise.all([
      getStats(),
      applicationsApi.list({ sort: 'createdAt', order: 'desc' }),
    ])
    return { stats, recent: list.applications.slice(0, 5) }
  }, [])

  if (loading) return <LoadingPanel label="Loading your dashboard…" />
  if (error) return <ErrorPanel message={error.message} onRetry={retry} />

  const { stats, recent } = data!
  const cards = [
    { label: 'Total applications', value: stats.total },
    { label: 'Applied this week', value: stats.appliedThisWeek },
    { label: 'In interview', value: stats.byStatus.INTERVIEW },
    { label: 'Offers', value: stats.byStatus.OFFER },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title={user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Welcome back'}
        description="A quiet place to keep your search moving."
        actions={
          <Link
            to="/applications/new"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 font-medium text-white transition-colors hover:bg-primary-light"
          >
            New application
          </Link>
        }
      />

      {stats.total === 0 ? (
        <EmptyPanel
          title="Nothing tracked yet"
          message="Save a company and a role to start your board. Everything else is optional."
          actionLabel="Add your first application"
          onAction={() => navigate('/applications/new')}
        />
      ) : (
        <>
          <section aria-label="At a glance" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="rounded-xl border border-line bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {card.label}
                </p>
                <p className="mt-3 font-mono text-3xl text-ink">{card.value}</p>
              </div>
            ))}
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">Recently added</h2>
              <Link to="/applications" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-line rounded-xl border border-line bg-white shadow-sm">
              {recent.map((application) => (
                <li key={application.id}>
                  <Link
                    to={`/applications/${application.id}`}
                    className="flex min-h-14 flex-wrap items-center justify-between gap-2 px-5 py-3 transition-colors hover:bg-surface/60"
                  >
                    <span>
                      <span className="font-medium text-ink">{application.company}</span>
                      <span className="ml-2 text-sm text-muted">{application.position}</span>
                    </span>
                    <span className="rounded-full border border-line bg-surface px-2 py-1 text-xs text-muted">
                      {STATUS_LABELS[application.status]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
