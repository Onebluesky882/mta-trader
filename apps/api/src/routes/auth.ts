import { Hono } from 'hono'
import { compare } from 'bcryptjs'
import { generateToken } from '@gover-agent/auth'

type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

const authRoute = new Hono<{ Bindings: Bindings }>()

/**
 * POST /api/auth/login
 *
 * Input:  { email: string, password: string }
 * Output: { token: string, expiresAt: string }
 * Error:  { error: string, code: "INVALID_CREDENTIALS" | "INTERNAL_ERROR" }
 *
 * Security notes:
 * - Password is compared with bcryptjs.compare — never logged or returned
 * - JWT is signed with JWT_SECRET from environment — never hardcoded
 */
authRoute.post('/login', async (c) => {
  let body: { email?: string; password?: string }

  try {
    body = await c.req.json<{ email?: string; password?: string }>()
  } catch {
    return c.json({ error: 'Invalid request body', code: 'INVALID_CREDENTIALS' }, 400)
  }

  const { email, password } = body

  if (!email || !password) {
    return c.json({ error: 'Email and password are required', code: 'INVALID_CREDENTIALS' }, 400)
  }

  try {
    // Look up user by email — never expose password_hash in response
    const row = await c.env.DB.prepare(
      'SELECT id, role, password_hash FROM users WHERE email = ?'
    )
      .bind(email)
      .first<{ id: string; role: string; password_hash: string }>()

    if (!row) {
      // Use the same error as a wrong password to prevent user enumeration
      return c.json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }, 401)
    }

    const passwordMatch = await compare(password, row.password_hash)

    if (!passwordMatch) {
      return c.json({ error: 'Invalid email or password', code: 'INVALID_CREDENTIALS' }, 401)
    }

    const token = await generateToken(row.id, row.role, c.env.JWT_SECRET)

    // expiresAt = 7 days from now (matches TOKEN_EXPIRY in auth.ts)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    return c.json({ token, expiresAt })
  } catch (err) {
    console.error('[auth/login] unexpected error:', err instanceof Error ? err.message : 'unknown')
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

export { authRoute }
