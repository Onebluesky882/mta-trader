// JWT token utilities (jose-based, Cloudflare Workers compatible)
export { generateToken, verifyToken } from './auth'
export type { TokenPayload } from './auth'

// Hono middleware
export { authMiddleware } from './middleware'

// Better-auth legacy exports (used by existing domains)
export { createAuth } from './better-auth'
export type { Auth } from './better-auth'
