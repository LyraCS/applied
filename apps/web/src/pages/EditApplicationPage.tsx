import { useNavigate, useParams } from 'react-router-dom'
import {
  ApplicationForm,
  toFormValues,
} from '../components/applications/ApplicationForm'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyPanel, ErrorPanel, LoadingPanel } from '../components/ui/States'
import { useAsync } from '../hooks/useAsync'
import { ApiError, applicationsApi } from '../lib/api'

export function EditApplicationPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, loading, error, retry } = useAsync(() => applicationsApi.get(id!), [id])

  if (loading) return <LoadingPanel label="Loading application…" />
  if (error) {
    return error instanceof ApiError && error.status === 404 ? (
      <EmptyPanel
        title="Application not found"
        message="It may have been deleted or belongs to another account."
        actionLabel="Back to applications"
        onAction={() => navigate('/applications')}
      />
    ) : (
      <ErrorPanel message={error.message} onRetry={retry} />
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Edit application"
        description="Change only what you need. Blank text clears a field."
      />
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-8">
        <ApplicationForm
          defaultValues={toFormValues(data!.application)}
          submitLabel="Save changes"
          onSubmit={async (values) => {
            await applicationsApi.update(id!, values)
            navigate(`/applications/${id}`)
          }}
        />
      </div>
    </div>
  )
}
