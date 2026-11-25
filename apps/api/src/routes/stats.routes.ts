import { Router } from 'express'
import { getStats } from '../controllers/application.controller'
import { asyncHandler } from '../lib/asyncHandler'
import { authenticate } from '../middleware/auth'

export const statsRoutes = Router()

statsRoutes.use(authenticate)
statsRoutes.get('/', asyncHandler(getStats))
