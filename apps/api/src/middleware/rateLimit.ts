import rateLimit from 'express-rate-limit'

// A login endpoint is a password-guessing interface. Ten attempts per
// quarter-hour per IP makes brute force impractical without hurting humans.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: { message: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' },
  },
})
