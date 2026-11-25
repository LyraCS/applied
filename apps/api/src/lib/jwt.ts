import type { Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export const COOKIE_NAME = 'applied_token'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

type SessionPayload = { sub: string }

export function signToken(userId: string): string {
  // `sub` ("subject") is the standard JWT field for "who this token is about".
  return jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: '7d' })
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    if (typeof payload === 'string' || typeof payload.sub !== 'string') return null
    return { sub: payload.sub }
  } catch {
    // Expired, tampered or malformed tokens are all simply "not logged in".
    return null
  }
}

export function setAuthCookie(res: Response, userId: string): void {
  res.cookie(COOKIE_NAME, signToken(userId), {
    httpOnly: true, // JavaScript cannot read it, so XSS cannot steal the token.
    sameSite: 'lax', // The frontend and API share one origin via proxy/rewrite.
    secure: env.NODE_ENV === 'production',
    maxAge: SEVEN_DAYS_MS,
    path: '/',
  })
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  })
}
