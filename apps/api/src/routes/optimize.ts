import { Hono } from 'hono'
import { createAuth, authMiddleware } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'
import { createD1Client } from '../db/client'

type Bindings = { DB: D1Database }

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]

interface SnapshotRow {
  id: string
  version: number
  params: string  // JSON string
  result: string  // JSON string
  label: string | null
  created_at: string
}

interface OptimizeResult {
  totalTrades: number
  winRate: number
  totalProfit: number
  maxDrawdown: number
  sharpeRatio: number | null
}

const optimizeRouter = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware to all optimize routes
optimizeRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

function rowToSnapshot(r: SnapshotRow) {
  return {
    id: r.id,
    version: r.version,
    params: JSON.parse(r.params) as Record<string, number | string | boolean>,
    result: JSON.parse(r.result) as OptimizeResult,
    label: r.label,
    createdAt: r.created_at,
  }
}

/**
 * GET /api/optimize
 * Returns all optimization snapshots ordered by created_at DESC
 */
optimizeRouter.get('/', async (c) => {
  try {
    const d1 = createD1Client(c.env.DB)
    const rows = await d1.query<SnapshotRow>(
      'SELECT * FROM optimize_snapshots ORDER BY created_at DESC'
    )
    return c.json({ snapshots: rows.map(rowToSnapshot) })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

/**
 * POST /api/optimize
 * Body: { params, result, label? }
 * Inserts a new snapshot with auto-incremented version
 */
optimizeRouter.post('/', async (c) => {
  let body: { params?: unknown; result?: unknown; label?: unknown }

  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  if (!body.params || typeof body.params !== 'object' || Array.isArray(body.params)) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }
  if (!body.result || typeof body.result !== 'object' || Array.isArray(body.result)) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  const result = body.result as Record<string, unknown>
  if (
    typeof result.totalTrades !== 'number' ||
    typeof result.winRate !== 'number' ||
    typeof result.totalProfit !== 'number' ||
    typeof result.maxDrawdown !== 'number'
  ) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  try {
    const d1 = createD1Client(c.env.DB)

    // Auto-increment version based on latest snapshot
    const latest = await d1.first<{ version: number }>(
      'SELECT version FROM optimize_snapshots ORDER BY version DESC LIMIT 1'
    )
    const nextVersion = latest ? latest.version + 1 : 1

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const label = typeof body.label === 'string' ? body.label : null

    await d1.run(
      'INSERT INTO optimize_snapshots (id, version, params, result, label, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, nextVersion, JSON.stringify(body.params), JSON.stringify(body.result), label, now]
    )

    return c.json(
      {
        id,
        version: nextVersion,
        params: body.params as Record<string, number | string | boolean>,
        result: body.result as OptimizeResult,
        label,
        createdAt: now,
      },
      201
    )
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

export { optimizeRouter }
