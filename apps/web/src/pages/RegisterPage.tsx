import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput } from '@applied/shared'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout'
import { FieldError } from '../components/ui/FieldError'
import { useAuth } from '../context/AuthContext'

const inputClass =
  'mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-ink placeholder:text-muted/70 focus:border-primary'

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await signUp(values.name, values.email, values.password)
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Unable to create account')
    }
  })

  return (
    <AuthLayout title="Create your account" subtitle="Your applications stay private to you.">
      {serverError && (
        <div role="alert" className="mt-5 rounded-md bg-red-50 p-3 text-sm text-danger">
          {serverError}
        </div>
      )}
      <form noValidate onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-ink">
            Name
          </label>
          <input
            id="name"
            autoComplete="name"
            className={inputClass}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
            {...register('name')}
          />
          <FieldError id="name-error" message={errors.name?.message} />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClass}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            aria-invalid={Boolean(errors.password)}
            aria-describedby="password-hint"
            {...register('password')}
          />
          <p id="password-hint" className="mt-1 text-sm text-muted">
            At least 8 characters.
          </p>
          <FieldError id="password-error" message={errors.password?.message} />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-light disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-5 text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
