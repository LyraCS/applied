import {
  applicationCreateSchema,
  applicationIdParamsSchema,
  applicationUpdateSchema,
} from '@applied/shared'
import { Router } from 'express'
import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  updateApplication,
} from '../controllers/application.controller'
import { asyncHandler } from '../lib/asyncHandler'
import { authenticate } from '../middleware/auth'
import { validateApplicationQuery, validateBody, validateParams } from '../middleware/validate'

export const applicationRoutes = Router()

// One checkpoint for the whole router: none of these endpoints work without
// a valid cookie, and every controller scopes by the req.userId it sets.
applicationRoutes.use(authenticate)

const validId = validateParams(applicationIdParamsSchema)

applicationRoutes.get('/', validateApplicationQuery, asyncHandler(listApplications))
applicationRoutes.get('/:id', validId, asyncHandler(getApplication))
applicationRoutes.post('/', validateBody(applicationCreateSchema), asyncHandler(createApplication))
applicationRoutes.patch(
  '/:id',
  validId,
  validateBody(applicationUpdateSchema),
  asyncHandler(updateApplication),
)
applicationRoutes.delete('/:id', validId, asyncHandler(deleteApplication))
