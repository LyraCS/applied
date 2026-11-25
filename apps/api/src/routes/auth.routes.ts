import { loginSchema, registerSchema } from '@applied/shared'
import { Router } from 'express'
import { login, logout, me, register } from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'
import { authLimiter } from '../middleware/rateLimit'
import { validateBody } from '../middleware/validate'
import { asyncHandler } from '../lib/asyncHandler'

export const authRoutes = Router()

// Same limiter instance = one shared attempt counter for login + register.
authRoutes.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(register))
authRoutes.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(login))
authRoutes.post('/logout', logout)
authRoutes.get('/me', authenticate, asyncHandler(me))
