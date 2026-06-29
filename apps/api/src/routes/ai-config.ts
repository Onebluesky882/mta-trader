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

interface AiConfigRow {
  id: string
  params: string
  updated_at: string
}

export const AI_CONFIG_DEFAULTS = {
  aiEnabled: false,
  symbol: 'XAUUSD',
  confidenceMin: 70,
  rrMin: 1.5,
  analyzeH1: true,
  analyzeH4: true,
  useDynamicSL: false,
  maxSignalAgeMin: 60,
}

const aiConfigRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/ai-config/active — EA reads config (shared secret)
aiConfigRouter.get('/active', async (c) => {
  const secret = c.req.header('X-MT5-Secret')
  if (!secret || secret !== c.env.MT5_WEBHOOK_SECRET) return c.json({ error: 'Unauthorized' }, 401)

  const d1 = createD1Client(c.env.DB)
  const row = await d1.first<AiConfigRow>("SELECT * FROM ai_config WHERE id = 'singleton'")
  return c.json({ params: row ? JSON.parse(row.params) : AI_CONFIG_DEFAULTS })
})

aiConfigRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

// GET /api/ai-config
aiConfigRouter.get('/', async (c) => {
  try {
    const d1 = createD1Client(c.env.DB)
    const row = await d1.first<AiConfigRow>("SELECT * FROM ai_config WHERE id = 'singleton'")
    return c.json({ params: row ? JSON.parse(row.params) : AI_CONFIG_DEFAULTS, updatedAt: row?.updated_at ?? null })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// PUT /api/ai-config
aiConfigRouter.put('/', async (c) => {
  let body: { params?: unknown }
  try { body = await c.req.json() }
  catch { return c.json({ error: 'Invalid JSON' }, 400) }

  if (!body.params || typeof body.params !== 'object' || Array.isArray(body.params)) {
    return c.json({ error: 'Invalid params' }, 400)
  }
  try {
    const d1 = createD1Client(c.env.DB)
    const now = new Date().toISOString()
    const paramsStr = JSON.stringify(body.params)
    const existing = await d1.first<AiConfigRow>("SELECT id FROM ai_config WHERE id = 'singleton'")

    if (existing) {
      await d1.run("UPDATE ai_config SET params = ?, updated_at = ? WHERE id = 'singleton'", [paramsStr, now])
    } else {
      await d1.run(
        "INSERT INTO ai_config (id, params, updated_at) VALUES ('singleton', ?, ?)",
        [paramsStr, now]
      )
    }
    return c.json({ params: body.params, updatedAt: now })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { aiConfigRouter }
