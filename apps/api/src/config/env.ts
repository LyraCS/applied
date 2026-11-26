import 'dotenv/config'
import { z } from 'zod'

// One place that checks configuration. If a variable is missing or malformed,
// the process refuses to start instead of failing later on a random request.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  // How many proxy hops Express trusts when finding the visitor's IP for the
  // auth rate limiter. Local and Vercel Services = 1; add one per extra hop.
  TRUST_PROXY: z.coerce.number().int().nonnegative().default(1),
})

export const env = envSchema.parse(process.env)
