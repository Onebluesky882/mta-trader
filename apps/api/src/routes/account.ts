import { Hono } from 'hono'
import { createAuth, authMiddleware } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'
import { createD1Client } from '../db/client'

type Bindings = { DB: D1Database }
type Variables = { user: { id: string; email: string } }

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]

interface ApiKeyRow {
  id: string
  user_id: string
  api_key: string
  created_at: string
}

const accountRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

accountRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

// GET /api/account/api-key — return (or generate) personal MT5 API key
accountRouter.get('/api-key', async (c) => {
  const user = c.get('user')
  const userId = user?.id
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const d1 = createD1Client(c.env.DB)
  let row = await d1.first<ApiKeyRow>(
    'SELECT * FROM user_api_keys WHERE user_id = ?', [userId]
  )

  if (!row) {
    // Generate a new API key
    const apiKey = `mt5-${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await d1.run(
      'INSERT INTO user_api_keys (id, user_id, api_key, created_at) VALUES (?, ?, ?, ?)',
      [id, userId, apiKey, now]
    )
    row = { id, user_id: userId, api_key: apiKey, created_at: now }
  }

  return c.json({ apiKey: row.api_key, createdAt: row.created_at })
})

// POST /api/account/api-key/regenerate — generate a new key
accountRouter.post('/api-key/regenerate', async (c) => {
  const user = c.get('user')
  const userId = user?.id
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  const d1 = createD1Client(c.env.DB)
  const apiKey = `mt5-${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`
  const now = new Date().toISOString()

  const existing = await d1.first<ApiKeyRow>(
    'SELECT id FROM user_api_keys WHERE user_id = ?', [userId]
  )

  if (existing) {
    await d1.run(
      'UPDATE user_api_keys SET api_key = ?, created_at = ? WHERE user_id = ?',
      [apiKey, now, userId]
    )
  } else {
    await d1.run(
      'INSERT INTO user_api_keys (id, user_id, api_key, created_at) VALUES (?, ?, ?, ?)',
      [crypto.randomUUID(), userId, apiKey, now]
    )
  }

  return c.json({ apiKey, createdAt: now })
})

export { accountRouter }
