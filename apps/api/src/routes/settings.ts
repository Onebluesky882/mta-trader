import { Hono } from 'hono'
import { createAuth, authMiddleware } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'
import { createD1Client } from '../db/client'

type Bindings = { DB: D1Database; MT5_WEBHOOK_SECRET: string }
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

// GET /api/settings/active — EA reads settings (shared secret)
settingsRouter.get('/active', async (c) => {
  const secret = c.req.header('X-MT5-Secret')
  if (!secret || secret !== c.env.MT5_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  try {
    const d1 = createD1Client(c.env.DB)
    let row = await d1.first<SettingsRow>(
      "SELECT * FROM algorithm_settings WHERE id = 'singleton'"
    )
    if (!row) {
      const now = new Date().toISOString()
      await d1.run(
        "INSERT INTO algorithm_settings (id, version, params, updated_at) VALUES ('singleton', 1, ?, ?)",
        [JSON.stringify(DEFAULT_PARAMS), now]
      )
      row = { id: 'singleton', version: 1, params: JSON.stringify(DEFAULT_PARAMS), updated_at: now }
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
  try {
    const d1 = createD1Client(c.env.DB)
    let row = await d1.first<SettingsRow>(
      "SELECT * FROM algorithm_settings WHERE id = 'singleton'"
    )
    if (!row) {
      const now = new Date().toISOString()
      await d1.run(
        "INSERT INTO algorithm_settings (id, version, params, updated_at) VALUES ('singleton', 1, ?, ?)",
        [JSON.stringify(DEFAULT_PARAMS), now]
      )
      row = { id: 'singleton', version: 1, params: JSON.stringify(DEFAULT_PARAMS), updated_at: now }
    }
    return c.json({ id: row.id, version: row.version, params: JSON.parse(row.params), updatedAt: row.updated_at })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

// PUT /api/settings
settingsRouter.put('/', async (c) => {
  let body: { params?: unknown }
  try { body = await c.req.json() }
  catch { return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400) }

  if (!body.params || typeof body.params !== 'object' || Array.isArray(body.params)) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }
  try {
    const d1 = createD1Client(c.env.DB)
    const existing = await d1.first<SettingsRow>(
      "SELECT * FROM algorithm_settings WHERE id = 'singleton'"
    )
    const newVersion = existing ? existing.version + 1 : 1
    const now = new Date().toISOString()
    const paramsStr = JSON.stringify(body.params)

    if (existing) {
      await d1.run(
        "UPDATE algorithm_settings SET version = ?, params = ?, updated_at = ? WHERE id = 'singleton'",
        [newVersion, paramsStr, now]
      )
    } else {
      await d1.run(
        "INSERT INTO algorithm_settings (id, version, params, updated_at) VALUES ('singleton', ?, ?, ?)",
        [newVersion, paramsStr, now]
      )
    }
    return c.json({ id: 'singleton', version: newVersion, params: body.params, updatedAt: now })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

export { settingsRouter }
