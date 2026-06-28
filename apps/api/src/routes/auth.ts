import { Hono } from 'hono'
import { createAuth } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'

type Bindings = { DB: D1Database; OWNER_EMAIL?: string }

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]

const authRouter = new Hono<{ Bindings: Bindings }>()

/**
 * POST /api/auth/login
 * Contract: { email, password } → { token, expiresAt }
 */
authRouter.post('/login', async (c) => {
  let body: { email?: unknown; password?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  const { email, password } = body

  if (typeof email !== 'string' || !email.trim()) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }
  if (typeof password !== 'string' || !password) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  try {
    const db = createDb(c.env.DB)
    const auth = createAuth(db, TRUSTED_ORIGINS, c.env.OWNER_EMAIL)

    // better-auth's signInEmail returns { token, user } when bearer plugin is enabled
    const result = await auth.api.signInEmail({
      body: { email: email.trim(), password },
    })

    const token = (result as unknown as { token?: string }).token ?? ''
    // Session expires in 7 days (matches auth.ts session config)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    return c.json({ token, expiresAt })
  } catch {
    return c.json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }, 401)
  }
})

/**
 * POST /api/auth/register
 * Contract: { email, password, name? } → { token, expiresAt }
 */
authRouter.post('/register', async (c) => {
  let body: { email?: unknown; password?: unknown; name?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  const { email, password, name } = body

  if (typeof email !== 'string' || !email.trim()) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }
  if (typeof password !== 'string' || password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters', code: 'INVALID_PARAMS' }, 400)
  }

  try {
    const db = createDb(c.env.DB)
    const auth = createAuth(db, TRUSTED_ORIGINS, c.env.OWNER_EMAIL)

    const result = await auth.api.signUpEmail({
      body: {
        email: email.trim(),
        password,
        name: typeof name === 'string' ? name : email.trim().split('@')[0],
      },
    })

    const token = (result as unknown as { token?: string }).token ?? ''
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    return c.json({ token, expiresAt }, 201)
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('duplicate')) {
      return c.json({ error: 'Email already in use', code: 'EMAIL_EXISTS' }, 409)
    }
    return c.json({ error: 'Registration failed', code: 'REGISTER_FAILED' }, 500)
  }
})

export { authRouter as mtaAuthRouter }
