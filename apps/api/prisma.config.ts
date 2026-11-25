import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

// Prisma CLI configuration (separate from the schema since v7).
// Migrations use the DIRECT_URL; the running app uses the pooled DATABASE_URL.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations', seed: 'tsx prisma/seed.ts' },
  datasource: { url: env('DIRECT_URL') },
})
