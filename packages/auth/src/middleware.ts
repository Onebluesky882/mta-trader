import type { MiddlewareHandler } from 'hono'
import type { Auth } from './auth'

/**
 * Hono middleware that validates a Bearer token via better-auth.
 * Returns 401 with the standard error envelope when the token is missing
 * or invalid.  Stores the resolved session user in `c.var.user`.
 *
 * Usage:
 *   import { createAuth, authMiddleware } from '@gover-agent/auth'
 *   const auth = createAuth(db, TRUSTED_ORIGINS)
 *   router.use('*', authMiddleware(auth))
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function authMiddleware(auth: Auth): MiddlewareHandler<any> {
  return async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session) {
      return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
    }
    c.set('user', session.user)
    await next()
  }
}
