import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import { prisma } from '../src/lib/prisma'

type Agent = ReturnType<typeof request.agent>

const PASSWORD = 'phase4-test-password'
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

let alice: { agent: Agent; id: string }
let bob: { agent: Agent; id: string }
let acmeId: string

async function registerFixture(label: string) {
  const agent = request.agent(app)
  const response = await agent.post('/api/auth/register').send({
    name: `Phase4 ${label}`,
    email: `phase4-${label}-${suffix}@example.com`,
    password: PASSWORD,
  })
  expect(response.status).toBe(201)
  return { agent, id: response.body.user.id as string }
}

beforeAll(async () => {
  alice = await registerFixture('alice')
  bob = await registerFixture('bob')

  const acme = await alice.agent.post('/api/applications').send({
    company: 'Acme Corp',
    position: 'Software Engineer',
    status: 'APPLIED',
    jobType: 'FULL_TIME',
    location: 'Remote',
    appliedAt: new Date().toISOString(),
  })
  expect(acme.status).toBe(201)
  acmeId = acme.body.application.id

  const beta = await alice.agent.post('/api/applications').send({
    company: 'Beta Labs',
    position: 'Data Analyst',
    status: 'INTERVIEW',
    jobType: 'INTERNSHIP',
    // Deliberately outside this week so the stats test can tell them apart.
    appliedAt: '2020-01-01T00:00:00.000Z',
  })
  expect(beta.status).toBe(201)

  const created = await alice.agent.post('/api/applications').send({
    company: 'Zeta Systems',
    position: 'Frontend Engineer',
    status: 'SAVED',
    jobType: 'CONTRACT',
  })
  expect(created.status).toBe(201)

  // Bob owns an "Acme" row too, so a search that ignores userId would show up
  // as an extra result in Alice's list.
  const rival = await bob.agent.post('/api/applications').send({
    company: 'Acme Rival',
    position: 'Engineer',
    status: 'APPLIED',
    jobType: 'FULL_TIME',
  })
  expect(rival.status).toBe(201)
})

afterAll(async () => {
  if (alice?.id || bob?.id) {
    await prisma.user.deleteMany({
      where: { id: { in: [alice?.id, bob?.id].filter((id): id is string => Boolean(id)) } },
    })
  }
  await prisma.$disconnect()
})

describe('applications API', () => {
  it('requires a session', async () => {
    expect((await request(app).get('/api/applications')).status).toBe(401)
    expect((await request(app).get('/api/stats')).status).toBe(401)
  })

  it('stores the JWT user as the owner, not an id from the body', async () => {
    const response = await alice.agent.post('/api/applications').send({
      company: 'Ownership Inc',
      position: 'Engineer',
      userId: bob.id, // ignored: ownership comes only from the cookie
    })
    expect(response.status).toBe(201)
    expect(response.body.application.userId).toBe(alice.id)
    await alice.agent.delete(`/api/applications/${response.body.application.id}`).expect(200)
  })

  it('lists and searches only the signed-in user’s rows', async () => {
    const aliceList = await alice.agent.get('/api/applications')
    expect(aliceList.status).toBe(200)
    expect(aliceList.body.applications).toHaveLength(3)
    expect(aliceList.body.applications.every((row: { userId: string }) => row.userId === alice.id)).toBe(
      true,
    )

    const bobList = await bob.agent.get('/api/applications')
    expect(bobList.body.applications).toHaveLength(1)
    expect(bobList.body.applications[0].company).toBe('Acme Rival')

    const search = await alice.agent.get('/api/applications?q=acme')
    expect(search.body.applications.map((row: { company: string }) => row.company)).toEqual([
      'Acme Corp',
    ])
  })

  it('filters by status and job type', async () => {
    const byStatus = await alice.agent.get('/api/applications?status=INTERVIEW')
    expect(byStatus.body.applications.map((row: { company: string }) => row.company)).toEqual([
      'Beta Labs',
    ])

    const byType = await alice.agent.get('/api/applications?jobType=INTERNSHIP')
    expect(byType.body.applications.map((row: { company: string }) => row.company)).toEqual([
      'Beta Labs',
    ])
  })

  it('sorts by whitelisted fields and rejects unknown sort values', async () => {
    const sorted = await alice.agent.get('/api/applications?sort=company&order=asc')
    expect(sorted.body.applications.map((row: { company: string }) => row.company)).toEqual([
      'Acme Corp',
      'Beta Labs',
      'Zeta Systems',
    ])

    const defaults = await alice.agent.get('/api/applications')
    expect(defaults.body.applications[0].company).not.toBe('Beta Labs') // newest first

    const rejected = await alice.agent.get('/api/applications?sort=passwordHash')
    expect(rejected.status).toBe(400)
    expect(rejected.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('reports stats only for the signed-in user', async () => {
    const aliceStats = await alice.agent.get('/api/stats')
    expect(aliceStats.status).toBe(200)
    expect(aliceStats.body).toEqual({
      total: 3,
      byStatus: { SAVED: 1, APPLIED: 1, INTERVIEW: 1, OFFER: 0, REJECTED: 0 },
      appliedThisWeek: 1,
    })

    const bobStats = await bob.agent.get('/api/stats')
    expect(bobStats.body.total).toBe(1)
    expect(bobStats.body.appliedThisWeek).toBe(0)
  })

  it('returns 404 for another user’s record on read, update and delete', async () => {
    await bob.agent.get(`/api/applications/${acmeId}`).expect(404)
    const patched = await bob.agent
      .patch(`/api/applications/${acmeId}`)
      .send({ position: 'Hacked' })
    expect(patched.status).toBe(404)
    await bob.agent.delete(`/api/applications/${acmeId}`).expect(404)

    // Nothing above changed Alice's row.
    const stillThere = await alice.agent.get(`/api/applications/${acmeId}`)
    expect(stillThere.body.application.position).toBe('Software Engineer')
  })

  it('updates and deletes its own row', async () => {
    const created = await alice.agent.post('/api/applications').send({
      company: 'Temporary Co',
      position: 'Engineer',
    })
    const id = created.body.application.id as string

    const updated = await alice.agent
      .patch(`/api/applications/${id}`)
      .send({ status: 'OFFER', notes: '  ' })
    expect(updated.status).toBe(200)
    expect(updated.body.application.status).toBe('OFFER')
    expect(updated.body.application.notes).toBeNull() // blank text becomes null

    const deleted = await alice.agent.delete(`/api/applications/${id}`)
    expect(deleted.body).toEqual({ ok: true })
    await alice.agent.get(`/api/applications/${id}`).expect(404)
  })

  it('rejects invalid bodies and malformed ids', async () => {
    const empty = await alice.agent.post('/api/applications').send({})
    expect(empty.status).toBe(400)
    expect(empty.body.error.code).toBe('VALIDATION_ERROR')

    const unsafeUrl = await alice.agent
      .post('/api/applications')
      .send({ company: 'X', position: 'Y', portalUrl: 'javascript:alert(1)' })
    expect(unsafeUrl.status).toBe(400)

    await alice.agent.get('/api/applications/not-a-uuid').expect(400)
  })
})
