import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { prisma } from '../src/lib/prisma'

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const email = `phase7-auth-${suffix}@example.com`
const PASSWORD = 'phase7-password-123'
let userId: string | null = null

// With `trust proxy = 1`, express-rate-limit keys on X-Forwarded-For. Giving
// each test its own IP stops one test's attempts from throttling the next.
const ip = (n: number) => `10.7.${n}.1`

afterAll(async () => {
  if (userId) await prisma.user.deleteMany({ where: { id: userId } })
  await prisma.$disconnect()
})

describe('auth API', () => {
  it('registers with a session cookie and rejects a duplicate email', async () => {
    const agent = request.agent(app)
    const created = await agent
      .post('/api/auth/register')
      .set('X-Forwarded-For', ip(1))
      .send({ name: 'Phase Seven', email, password: PASSWORD })

    expect(created.status).toBe(201)
    expect(created.body.user.email).toBe(email)
    expect(created.body.user).not.toHaveProperty('passwordHash')
    const cookie = String(created.headers['set-cookie']?.[0] ?? '')
    expect(cookie).toContain('applied_token=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')
    userId = created.body.user.id as string

    const duplicate = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', ip(2))
      .send({ name: 'Someone Else', email, password: PASSWORD })
    expect(duplicate.status).toBe(409)
    expect(duplicate.body.error.code).toBe('EMAIL_TAKEN')
  })

  it('logs in with the right password and rejects the wrong one', async () => {
    const good = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', ip(3))
      .send({ email, password: PASSWORD })
    expect(good.status).toBe(200)
    expect(good.body.user.email).toBe(email)

    const bad = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', ip(4))
      .send({ email, password: 'definitely-wrong' })
    expect(bad.status).toBe(401)
    expect(bad.body.error.code).toBe('INVALID_CREDENTIALS')
  })

  it('protects /me with the cookie and never returns the password hash', async () => {
    const anonymous = await request(app).get('/api/auth/me')
    expect(anonymous.status).toBe(401)
    expect(anonymous.body.error.code).toBe('UNAUTHORIZED')

    const tampered = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'applied_token=not-a-jwt')
    expect(tampered.status).toBe(401)

    const agent = request.agent(app)
    await agent
      .post('/api/auth/login')
      .set('X-Forwarded-For', ip(5))
      .send({ email, password: PASSWORD })
    const me = await agent.get('/api/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.user.id).toBe(userId)
    expect(me.body.user).not.toHaveProperty('passwordHash')
  })

  it('returns field issues for invalid register and login bodies', async () => {
    const badRegister = await request(app)
      .post('/api/auth/register')
      .set('X-Forwarded-For', ip(6))
      .send({ name: '', email: 'not-an-email', password: 'short' })
    expect(badRegister.status).toBe(400)
    expect(badRegister.body.error.code).toBe('VALIDATION_ERROR')
    const fields = badRegister.body.error.issues.map((issue: { path: string[] }) => issue.path[0])
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']))

    const badLogin = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', ip(7))
      .send({ email })
    expect(badLogin.status).toBe(400)
    expect(badLogin.body.error.issues[0].path).toContain('password')
  })

  it('throttles repeated auth attempts from one IP', async () => {
    // A nonexistent address keeps this fast (no bcrypt compare) while still
    // counting as a login attempt.
    const unknown = `nobody-${suffix}@example.com`
    const attacker = ip(9)
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', attacker)
        .send({ email: unknown, password: 'wrong-password' })
      expect(response.status).toBe(401)
    }

    // Even the correct password is blocked once the cap is reached.
    const blocked = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', attacker)
      .send({ email, password: PASSWORD })
    expect(blocked.status).toBe(429)
    expect(blocked.body.error.code).toBe('RATE_LIMITED')
  })
})
