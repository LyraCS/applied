import { useNavigate } from 'react-router-dom'
import { ApplicationForm, emptyFormValues } from '../components/applications/ApplicationForm'
import { PageHeader } from '../components/ui/PageHeader'
import { applicationsApi } from '../lib/api'

export function NewApplicationPage() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="New application"
        description="Add a company and a role — the rest can wait."
      />
      <div className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-8">
        <ApplicationForm
          defaultValues={emptyFormValues}
          submitLabel="Save application"
          onSubmit={async (values) => {
            const { application } = await applicationsApi.create(values)
            navigate(`/applications/${application.id}`)
          }}
        />
      </div>
    </div>
  )
}
