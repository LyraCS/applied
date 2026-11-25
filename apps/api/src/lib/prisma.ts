import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'
import { env } from '../config/env'

// Prisma 7 talks to Postgres through the `pg` driver via an adapter.
// One shared client avoids opening a new connection pool per request.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })
