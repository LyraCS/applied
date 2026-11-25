import { z } from 'zod'
import { JOB_TYPES, STATUSES } from './constants'

// Zod transforms run before validation, so "  ME@x.com " becomes "me@x.com".
export const emailSchema = z.string().trim().toLowerCase().email().max(254)

// bcrypt only considers the first 72 bytes; capping length avoids two passwords
// that look different but hash identically.
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: emailSchema,
  password: passwordSchema,
})

export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

// Empty strings become null so the forgiving form can send every field without
// the database storing "" everywhere.
const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value === '' ? null : value))
    .optional()

const nullableDate = z
  .string()
  .refine((value) => value === '' || !Number.isNaN(Date.parse(value)), 'Invalid date')
  .transform((value) => (value === '' ? null : new Date(value)))
  .optional()
  .nullable()

// `new URL` accepts more than just http(s); restrict it so a `javascript:`
// value can never be stored and later rendered as a link.
function isHttpUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export const applicationCreateSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(120),
  position: z.string().trim().min(1, 'Position is required').max(120),
  appliedAt: nullableDate,
  portalUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((value) => value === '' || isHttpUrl(value), 'Enter a full URL, starting with https://')
    .transform((value) => (value === '' ? null : value))
    .optional(),
  hiringContact: nullableText(120),
  location: nullableText(120),
  status: z.enum(STATUSES).optional(),
  jobDescription: nullableText(5000),
  qualifications: nullableText(5000),
  salary: nullableText(120),
  jobType: z.enum(JOB_TYPES).optional().nullable(),
  notes: nullableText(5000),
})

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>
// Form values are strings; the schema transforms them to Date/null on submit.
export type ApplicationCreateValues = z.input<typeof applicationCreateSchema>

// A partial update: omitting a field leaves it untouched.
export const applicationUpdateSchema = applicationCreateSchema.partial()
export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>

// Only these strings may become Prisma `orderBy` keys. A free-text sort field
// would let a caller poke at columns the screen was never designed to sort.
export const SORT_FIELDS = ['appliedAt', 'createdAt', 'company'] as const

export const applicationQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.enum(STATUSES).optional(),
  jobType: z.enum(JOB_TYPES).optional(),
  sort: z.enum(SORT_FIELDS).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type ApplicationQuery = z.infer<typeof applicationQuerySchema>

// Rejecting a malformed UUID here avoids a Prisma error (and a 500) later.
export const applicationIdSchema = z.string().uuid()
export const applicationIdParamsSchema = z.object({ id: applicationIdSchema })
