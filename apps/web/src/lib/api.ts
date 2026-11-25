import type { JobType, Status } from '@applied/shared'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type ErrorBody = { error?: { message?: string; code?: string } }

// One fetch wrapper for every API call: cookies included, JSON parsed,
// non-2xx turned into a useful error. Components never repeat this.
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include', // The httpOnly cookie rides along on every call.
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  // A 204 or a proxy HTML page has no JSON; null keeps error handling simple.
  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const body = data as ErrorBody | null
    throw new ApiError(
      body?.error?.message ?? 'Something went wrong. Please try again.',
      response.status,
      body?.error?.code,
    )
  }

  return data as T
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export type Application = {
  id: string
  userId: string
  company: string
  position: string
  appliedAt: string | null
  portalUrl: string | null
  hiringContact: string | null
  location: string | null
  status: Status
  jobDescription: string | null
  qualifications: string | null
  salary: string | null
  jobType: JobType | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type ApplicationQueryParams = {
  q?: string
  status?: Status
  jobType?: JobType
  sort?: 'appliedAt' | 'createdAt' | 'company'
  order?: 'asc' | 'desc'
}

export type Stats = {
  total: number
  byStatus: Record<Status, number>
  appliedThisWeek: number
}

function queryString(params: ApplicationQueryParams): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value)
  }
  const result = search.toString()
  return result ? `?${result}` : ''
}

// The only place that knows application URLs and response envelopes.
export const applicationsApi = {
  list: (params: ApplicationQueryParams = {}) =>
    apiFetch<{ applications: Application[] }>(`/applications${queryString(params)}`),
  get: (id: string) =>
    apiFetch<{ application: Application }>(`/applications/${encodeURIComponent(id)}`),
  create: (values: unknown) =>
    postJson<{ application: Application }>('/applications', values),
  update: (id: string, values: unknown) =>
    apiFetch<{ application: Application }>(`/applications/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(values),
    }),
  remove: (id: string) =>
    apiFetch<{ ok: true }>(`/applications/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export const getStats = () => apiFetch<Stats>('/stats')
