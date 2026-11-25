import bcrypt from 'bcryptjs'

// Cost 12 is deliberately slow (~250 ms on a laptop). That "wasted" time is
// what makes guessing a password expensive. Raise it when hardware improves.
const SALT_ROUNDS = 12

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
