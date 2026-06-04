import rateLimit from 'express-rate-limit'

// Strict limiter for auth endpoints (login, register)
// 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again in 15 minutes' },
})

// Looser limiter for AI endpoints (Groq calls)
// 30 requests per minute per IP — protects against runaway usage / bill spikes
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many AI requests, please slow down' },
})
