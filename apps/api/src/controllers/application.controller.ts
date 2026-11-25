import {
  STATUSES,
  type ApplicationCreateInput,
  type ApplicationQuery,
  type ApplicationUpdateInput,
  type Status,
} from '@applied/shared'
import type { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../lib/prisma'

const notFound = { error: { message: 'Application not found', code: 'NOT_FOUND' } }

// Monday 00:00 UTC. UTC makes "this week" the same on a laptop and on Render.
function startOfWeek(): Date {
  const now = new Date()
  const daysSinceMonday = (now.getUTCDay() + 6) % 7
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysSinceMonday),
  )
}

export async function listApplications(req: Request, res: Response) {
  const query = req.applicationQuery as ApplicationQuery
  const where: Prisma.ApplicationWhereInput = { userId: req.userId! } // JWT only.

  if (query.q) {
    where.OR = [
      { company: { contains: query.q, mode: 'insensitive' } },
      { position: { contains: query.q, mode: 'insensitive' } },
      { location: { contains: query.q, mode: 'insensitive' } },
    ]
  }
  if (query.status) where.status = query.status
  if (query.jobType) where.jobType = query.jobType

  // `sort` can only be one of three column names because the shared Zod enum
  // rejected everything else. User text is never interpolated into orderBy.
  const orderBy = { [query.sort]: query.order } as Prisma.ApplicationOrderByWithRelationInput

  const applications = await prisma.application.findMany({ where, orderBy })
  return res.json({ applications })
}

export async function getApplication(req: Request, res: Response) {
  // findFirst, not findUnique: the ID alone is not permission to read a row.
  const application = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!application) return res.status(404).json(notFound)
  return res.json({ application })
}

export async function createApplication(req: Request, res: Response) {
  const application = await prisma.application.create({
    data: { ...(req.body as ApplicationCreateInput), userId: req.userId! },
  })
  return res.status(201).json({ application })
}

export async function updateApplication(req: Request, res: Response) {
  // updateMany with both id and userId: a match on ID alone would let user B
  // overwrite user A's row. Zero affected rows is reported as 404 either way,
  // so the endpoint cannot be used to probe whether an ID exists.
  const result = await prisma.application.updateMany({
    where: { id: req.params.id, userId: req.userId! },
    data: req.body as ApplicationUpdateInput,
  })
  if (result.count === 0) return res.status(404).json(notFound)

  const application = await prisma.application.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  return res.json({ application })
}

export async function deleteApplication(req: Request, res: Response) {
  const result = await prisma.application.deleteMany({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (result.count === 0) return res.status(404).json(notFound)
  return res.json({ ok: true })
}

export async function getStats(req: Request, res: Response) {
  const userId = req.userId!
  const [total, grouped, appliedThisWeek] = await Promise.all([
    prisma.application.count({ where: { userId } }),
    prisma.application.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.application.count({ where: { userId, appliedAt: { gte: startOfWeek() } } }),
  ])

  // Start with every status at zero so the dashboard never has to guess which
  // columns exist; groupBy only returns statuses that have rows.
  const byStatus = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<
    Status,
    number
  >
  for (const row of grouped) byStatus[row.status] = row._count._all

  return res.json({ total, byStatus, appliedThisWeek })
}
