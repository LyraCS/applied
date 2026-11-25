import type { LoginInput, RegisterInput } from '@applied/shared'
import type { Request, Response } from 'express'
import { clearAuthCookie, setAuthCookie } from '../lib/jwt'
import { hashPassword, verifyPassword } from '../lib/password'
import { prisma } from '../lib/prisma'

const publicUser = { id: true, name: true, email: true }

// Prisma reports a duplicate unique column with code P2002. Checking also
// covers the race where two registers with the same email arrive together.
function isDuplicateEmail(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002'
}

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body as RegisterInput

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res
      .status(409)
      .json({ error: { message: 'Email already registered', code: 'EMAIL_TAKEN' } })
  }

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password) },
      select: publicUser,
    })
    setAuthCookie(res, user.id)
    return res.status(201).json({ user })
  } catch (err) {
    if (isDuplicateEmail(err)) {
      return res
        .status(409)
        .json({ error: { message: 'Email already registered', code: 'EMAIL_TAKEN' } })
    }
    throw err
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as LoginInput

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res
      .status(401)
      .json({ error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' } })
  }

  setAuthCookie(res, user.id)
  return res.json({
    user: { id: user.id, name: user.name, email: user.email },
  })
}

export function logout(_req: Request, res: Response) {
  clearAuthCookie(res)
  return res.json({ ok: true })
}

export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: publicUser,
  })
  if (!user) {
    return res.status(401).json({ error: { message: 'Account not found', code: 'UNAUTHORIZED' } })
  }
  return res.json({ user })
}
