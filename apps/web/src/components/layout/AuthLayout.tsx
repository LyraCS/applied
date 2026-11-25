import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <Link to="/" className="text-lg font-bold tracking-tight text-primary">
          Applied
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        {children}
      </section>
    </main>
  )
}
