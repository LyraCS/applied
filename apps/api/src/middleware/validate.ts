import { applicationQuerySchema, type ApplicationQuery } from '@applied/shared'
import type { NextFunction, Request, Response } from 'express'
import type { ZodTypeAny } from 'zod'

declare module 'express-serve-static-core' {
  interface Request {
    // Express 4 exposes `req.query` as a read-only getter, so parsed query
    // values (including Zod defaults) live in their own field.
    applicationQuery?: ApplicationQuery
  }
}

function validationError(res: Response, location: 'request' | 'query', issues: unknown) {
  return res.status(400).json({
    error: {
      message: location === 'query' ? 'Invalid query' : 'Invalid request',
      code: 'VALIDATION_ERROR',
      issues,
    },
  })
}

// Returns middleware so every route can declare its own schema inline.
// Zod's `safeParse` never throws: it returns issues we can send to the form.
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) return validationError(res, 'request', result.error.issues)
    req.body = result.data
    next()
  }
}

// Same idea for URL query parameters. The shared schema applies defaults and
// rejects unknown sort values before they can reach Prisma.
export function validateApplicationQuery(req: Request, res: Response, next: NextFunction) {
  const result = applicationQuerySchema.safeParse(req.query)
  if (!result.success) return validationError(res, 'query', result.error.issues)
  req.applicationQuery = result.data
  next()
}

// A malformed UUID would otherwise become a Prisma error and a 500.
export function validateParams(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params)
    if (!result.success) return validationError(res, 'request', result.error.issues)
    req.params = result.data as typeof req.params
    next()
  }
}
