import { zodResolver } from '@hookform/resolvers/zod'
import {
  applicationCreateSchema,
  JOB_TYPES,
  JOB_TYPE_LABELS,
  STATUSES,
  STATUS_LABELS,
  type ApplicationCreateInput,
  type ApplicationCreateValues,
} from '@applied/shared'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Application } from '../../lib/api'
import { FieldError } from '../ui/FieldError'

const inputClass =
  'mt-1 min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-ink placeholder:text-muted/70 transition-colors hover:border-primary'
const areaClass = `${inputClass} min-h-28 resize-y`

// Prisma returns ISO strings and nulls; a date input wants YYYY-MM-DD and a
// select wants '' for "none". This is the only place that translates.
export function toFormValues(application: Application): ApplicationCreateValues {
  return {
    company: application.company,
    position: application.position,
    appliedAt: application.appliedAt?.slice(0, 10) ?? '',
    portalUrl: application.portalUrl ?? '',
    hiringContact: application.hiringContact ?? '',
    location: application.location ?? '',
    status: application.status,
    jobDescription: application.jobDescription ?? '',
    qualifications: application.qualifications ?? '',
    salary: application.salary ?? '',
    jobType: application.jobType ?? null,
    notes: application.notes ?? '',
  }
}

export const emptyFormValues: ApplicationCreateValues = {
  company: '',
  position: '',
  appliedAt: '',
  portalUrl: '',
  hiringContact: '',
  location: '',
  status: 'SAVED',
  jobDescription: '',
  qualifications: '',
  salary: '',
  jobType: null,
  notes: '',
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <p id={`${id}-hint`} className="mt-1 text-sm text-muted">{hint}</p>}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  )
}

export function ApplicationForm({
  defaultValues,
  submitLabel,
  onSubmit,
}: {
  defaultValues: ApplicationCreateValues
  submitLabel: string
  onSubmit: (values: ApplicationCreateInput) => Promise<void>
}) {
  const [serverError, setServerError] = useState<string | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<ApplicationCreateValues, unknown, ApplicationCreateInput>({
    resolver: zodResolver(applicationCreateSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const errorCount = Object.keys(errors).length
  useEffect(() => {
    // After a failed submit, move keyboard focus to the linked summary.
    if (submitCount > 0 && errorCount > 0) summaryRef.current?.focus()
  }, [submitCount])

  // Every field gets the same accessible error wiring.
  const fieldProps = (name: keyof ApplicationCreateValues) => ({
    id: name,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })

  const submit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await onSubmit(values)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Could not save this application')
    }
  })

  return (
    <form noValidate onSubmit={submit} className="space-y-8">
      {submitCount > 0 && errorCount > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby="form-error-title"
          className="rounded-md bg-red-50 p-4"
        >
          <h2 id="form-error-title" className="font-medium text-ink">
            There is a problem
          </h2>
          <ul className="mt-2 list-inside list-disc text-sm text-danger">
            {Object.entries(errors).map(([name, error]) => (
              <li key={name}>
                <a href={`#${name}`} className="underline">
                  {(error as { message?: string }).message ?? name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {serverError && (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-danger">
          {serverError}
        </p>
      )}

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-ink">The essentials</h2>
        <p className="text-sm text-muted">Only the company and role are needed to start.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="company" label="Company *" error={errors.company?.message}>
            <input {...fieldProps('company')} {...register('company')} className={inputClass} />
          </Field>
          <Field id="position" label="Position *" error={errors.position?.message}>
            <input {...fieldProps('position')} {...register('position')} className={inputClass} />
          </Field>
          <Field id="status" label="Status" error={errors.status?.message}>
            <select {...fieldProps('status')} {...register('status')} className={inputClass}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
          </Field>
          <Field id="jobType" label="Job type" error={errors.jobType?.message}>
            <Controller
              name="jobType"
              control={control}
              render={({ field }) => (
                <select
                  id="jobType"
                  aria-invalid={Boolean(errors.jobType)}
                  aria-describedby={errors.jobType ? 'jobType-error' : undefined}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value === '' ? null : event.target.value)}
                  onBlur={field.onBlur}
                  className={inputClass}
                >
                  <option value="">Not specified</option>
                  {JOB_TYPES.map((jobType) => (
                    <option key={jobType} value={jobType}>{JOB_TYPE_LABELS[jobType]}</option>
                  ))}
                </select>
              )}
            />
          </Field>
          <Field id="appliedAt" label="Applied on" error={errors.appliedAt?.message}>
            <input {...fieldProps('appliedAt')} {...register('appliedAt')} type="date" className={inputClass} />
          </Field>
          <Field id="location" label="Location" error={errors.location?.message}>
            <input {...fieldProps('location')} {...register('location')} className={inputClass} />
          </Field>
          <Field id="portalUrl" label="Job posting URL" error={errors.portalUrl?.message}>
            <input {...fieldProps('portalUrl')} {...register('portalUrl')} type="url" className={inputClass} />
          </Field>
          <Field id="hiringContact" label="Hiring contact" error={errors.hiringContact?.message}>
            <input {...fieldProps('hiringContact')} {...register('hiringContact')} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-ink">Job details</h2>
        <p className="text-sm text-muted">Paste anything you want to come back to later.</p>
        <Field id="jobDescription" label="Job description" error={errors.jobDescription?.message}>
          <textarea {...fieldProps('jobDescription')} {...register('jobDescription')} className={areaClass} />
        </Field>
        <Field id="qualifications" label="Qualifications" error={errors.qualifications?.message}>
          <textarea {...fieldProps('qualifications')} {...register('qualifications')} className={areaClass} />
        </Field>
        <Field id="salary" label="Salary" error={errors.salary?.message}>
          <input {...fieldProps('salary')} {...register('salary')} className={inputClass} />
        </Field>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-ink">Your notes</h2>
        <Field id="notes" label="Notes" error={errors.notes?.message}>
          <textarea {...fieldProps('notes')} {...register('notes')} className={areaClass} />
        </Field>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-md bg-primary px-6 font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-60"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="min-h-11 rounded-md border border-line px-5 text-muted transition-colors hover:border-primary hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
