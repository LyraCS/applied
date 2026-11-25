import { config } from 'dotenv'
import { resolve } from 'node:path'

// env.ts parses process.env at import time. Load the dev-branch .env first so
// the app under test uses the same real database as `npm run dev:api`.
// process.cwd() is the repo root in both node and jsdom test environments.
config({ path: resolve(process.cwd(), 'apps/api/.env') })
