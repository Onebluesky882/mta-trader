import type { Auth } from '@gover-agent/auth'
import type { Context } from 'hono'

export async function handleAuth(c: Context, auth: Auth) {
  return auth.handler(c.req.raw)
}
