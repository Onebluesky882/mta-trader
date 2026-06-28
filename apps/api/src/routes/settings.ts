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

interface SettingsRow {
  id: string
  version: number
  params: string
  updated_at: string
  user_id: string
}

const DEFAULT_PARAMS = {
  symbol: 'EURUSD',
  direction: 'BUY',
  maxTrades: 1,
  lotSize: 0.01,
  stopLoss: 50,
  takeProfit: 100,
  rsiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
}

const settingsRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/settings/active — EA uses personal API key (X-MT5-Secret)
settingsRouter.get('/active', async (c) => {
  const secret = c.req.header('X-MT5-Secret')
  if (!secret) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const d1 = createD1Client(c.env.DB)
    const keyRow = await d1.first<{ user_id: string }>(
      'SELECT user_id FROM user_api_keys WHERE api_key = ?', [secret]
    )
    if (!keyRow) return c.json({ error: 'Unauthorized' }, 401)

    const userId = keyRow.user_id
    let row = await d1.first<SettingsRow>(
      'SELECT * FROM algorithm_settings WHERE user_id = ? ORDER BY version DESC LIMIT 1', [userId]
    )
    if (!row) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await d1.run(
        'INSERT INTO algorithm_settings (id, version, params, updated_at, user_id) VALUES (?, ?, ?, ?, ?)',
        [id, 1, JSON.stringify(DEFAULT_PARAMS), now, userId]
      )
      row = { id, version: 1, params: JSON.stringify(DEFAULT_PARAMS), updated_at: now, user_id: userId }
    }
    return c.json({ version: row.version, params: JSON.parse(row.params) })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

settingsRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

// GET /api/settings
settingsRouter.get('/', async (c) => {
  const user = c.get('user') as { id: string }
  const userId = user.id
  try {
    const d1 = createD1Client(c.env.DB)
    let row = await d1.first<SettingsRow>(
      'SELECT * FROM algorithm_settings WHERE user_id = ? ORDER BY version DESC LIMIT 1', [userId]
    )
    if (!row) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await d1.run(
        'INSERT INTO algorithm_settings (id, version, params, updated_at, user_id) VALUES (?, ?, ?, ?, ?)',
        [id, 1, JSON.stringify(DEFAULT_PARAMS), now, userId]
      )
      row = { id, version: 1, params: JSON.stringify(DEFAULT_PARAMS), updated_at: now, user_id: userId }
    }
    return c.json({ id: row.id, version: row.version, params: JSON.parse(row.params), updatedAt: row.updated_at })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

// PUT /api/settings
settingsRouter.put('/', async (c) => {
  const user = c.get('user') as { id: string }
  const userId = user.id
  let body: { params?: unknown }
  try { body = await c.req.json() }
  catch { return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400) }

  if (!body.params || typeof body.params !== 'object' || Array.isArray(body.params)) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }
  try {
    const d1 = createD1Client(c.env.DB)
    const existing = await d1.first<SettingsRow>(
      'SELECT * FROM algorithm_settings WHERE user_id = ? ORDER BY version DESC LIMIT 1', [userId]
    )
    const newVersion = existing ? existing.version + 1 : 1
    const id = existing?.id ?? crypto.randomUUID()
    const now = new Date().toISOString()
    const paramsStr = JSON.stringify(body.params)

    if (existing) {
      await d1.run(
        'UPDATE algorithm_settings SET version = ?, params = ?, updated_at = ? WHERE id = ?',
        [newVersion, paramsStr, now, id]
      )
    } else {
      await d1.run(
        'INSERT INTO algorithm_settings (id, version, params, updated_at, user_id) VALUES (?, ?, ?, ?, ?)',
        [id, newVersion, paramsStr, now, userId]
      )
    }
    return c.json({ id, version: newVersion, params: body.params, updatedAt: now })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

export { settingsRouter }
