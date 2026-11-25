import type { NextFunction, Request, Response } from 'express'
import { COOKIE_NAME, verifyToken } from '../lib/jwt'

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string
  }
}

// Middleware = a checkpoint in the request pipeline. `next()` passes control
// to the next checkpoint; returning a response stops the chain here.
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined
  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required', code: 'UNAUTHORIZED' } })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return res.status(401).json({ error: { message: 'Session expired', code: 'UNAUTHORIZED' } })
  }

  req.userId = payload.sub
  next()
}
