import { Hono } from 'hono'
import { createAuth, authMiddleware } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'
import { createD1Client } from '../db/client'

type Bindings = { DB: D1Database }

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
]

interface SettingsRow {
  id: string
  version: number
  params: string // JSON string
  updated_at: string
}

const DEFAULT_PARAMS = {
  rsiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  lotSize: 0.01,
  stopLoss: 50,
  takeProfit: 100,
}

const settingsRouter = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware to all settings routes
settingsRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

/**
 * GET /api/settings
 * Returns the latest algorithm_settings row; creates a default if none exists
 */
settingsRouter.get('/', async (c) => {
  try {
    const d1 = createD1Client(c.env.DB)

    let row = await d1.first<SettingsRow>(
      'SELECT * FROM algorithm_settings ORDER BY version DESC LIMIT 1'
    )

    if (!row) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      await d1.run(
        'INSERT INTO algorithm_settings (id, version, params, updated_at) VALUES (?, ?, ?, ?)',
        [id, 1, JSON.stringify(DEFAULT_PARAMS), now]
      )
      row = { id, version: 1, params: JSON.stringify(DEFAULT_PARAMS), updated_at: now }
    }

    return c.json({
      id: row.id,
      version: row.version,
      params: JSON.parse(row.params) as Record<string, number | string | boolean>,
      updatedAt: row.updated_at,
    })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

/**
 * PUT /api/settings
 * Body: { params: Record<string, number | string | boolean> }
 * Updates settings and bumps the version number
 */
settingsRouter.put('/', async (c) => {
  let body: { params?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  if (
    !body.params ||
    typeof body.params !== 'object' ||
    Array.isArray(body.params)
  ) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  try {
    const d1 = createD1Client(c.env.DB)

    const existing = await d1.first<SettingsRow>(
      'SELECT * FROM algorithm_settings ORDER BY version DESC LIMIT 1'
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
        'INSERT INTO algorithm_settings (id, version, params, updated_at) VALUES (?, ?, ?, ?)',
        [id, newVersion, paramsStr, now]
      )
    }

    return c.json({
      id,
      version: newVersion,
      params: body.params as Record<string, number | string | boolean>,
      updatedAt: now,
    })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

export { settingsRouter }
