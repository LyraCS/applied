import type { NextFunction, Request, RequestHandler, Response } from 'express'

// Express 4 does not forward rejected promises to error middleware. Wrapping
// every async controller means one database error returns a 500 instead of
// killing the process.
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}
