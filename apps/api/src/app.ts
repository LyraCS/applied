import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { applicationRoutes } from './routes/application.routes'
import { authRoutes } from './routes/auth.routes'
import { statsRoutes } from './routes/stats.routes'

export const app = express()

// Render terminates TLS before traffic reaches us; without this, Express
// would see the proxy's IP and rate limiting would throttle everyone together.
app.set('trust proxy', env.TRUST_PROXY)

app.use(helmet())
app.use(express.json()) // Parses JSON request bodies into req.body.
app.use(cookieParser()) // Parses the Cookie header into req.cookies.

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/stats', statsRoutes)

app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } })
})

app.use(errorHandler)
