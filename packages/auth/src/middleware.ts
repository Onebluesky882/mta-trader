import type { MiddlewareHandler } from 'hono'
import { verifyToken } from './auth'

export interface AuthEnv {
  Bindings: {
    JWT_SECRET: string
  }
  Variables: {
    user: { userId: string; role: string }
  }
}

/**
 * Hono middleware that validates the Authorization: Bearer <token> header.
 *
 * On success: sets c.get('user') = { userId, role } and calls next().
 * On failure: returns 401 { error, code: "UNAUTHORIZED" }.
 *
 * JWT_SECRET is read from c.env.JWT_SECRET — never hardcoded.
 */
export const authMiddleware = (): MiddlewareHandler<AuthEnv> => {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing or malformed Authorization header', code: 'UNAUTHORIZED' }, 401)
    }

    const token = authHeader.slice(7).trim()
    if (!token) {
      return c.json({ error: 'Missing token', code: 'UNAUTHORIZED' }, 401)
    }

    const secret = c.env.JWT_SECRET
    if (!secret) {
      return c.json({ error: 'Server misconfiguration', code: 'UNAUTHORIZED' }, 401)
    }

    const payload = await verifyToken(token, secret)

    if (!payload) {
      return c.json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' }, 401)
    }

    c.set('user', { userId: payload.userId, role: payload.role })

    await next()
  }
}
