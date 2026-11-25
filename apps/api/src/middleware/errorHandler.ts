import type { NextFunction, Request, Response } from 'express'

// Last middleware in the chain. Any thrown error or next(error) lands here,
// so routes never have to format a 500 themselves.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err)
  res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } })
}
