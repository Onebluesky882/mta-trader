import { Hono } from 'hono'
import { createAuth, authMiddleware } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'
import { createD1Client } from '../db/client'

type Bindings = { DB: D1Database }

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
]

interface TradeRow {
  id: string
  symbol: string
  direction: 'BUY' | 'SELL'
  open_price: number
  close_price: number | null
  open_time: string
  close_time: string | null
  profit: number | null
  volume: number
  status: 'OPEN' | 'CLOSED'
}

const tradesRouter = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware to all trade routes
tradesRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

/**
 * GET /api/trades
 * Query params: page, limit, from, to
 * Returns paginated trade list
 */
tradesRouter.get('/', async (c) => {
  const rawPage = c.req.query('page')
  const rawLimit = c.req.query('limit')
  const from = c.req.query('from')
  const to = c.req.query('to')

  const page = rawPage ? parseInt(rawPage, 10) : 1
  const limit = rawLimit ? parseInt(rawLimit, 10) : 50

  if (isNaN(page) || page < 1) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }
  if (isNaN(limit) || limit < 1 || limit > 200) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  // Validate date strings if provided
  if (from && isNaN(Date.parse(from))) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }
  if (to && isNaN(Date.parse(to))) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  try {
    const d1 = createD1Client(c.env.DB)

    // Build WHERE clause for date filtering
    const conditions: string[] = []
    const params: unknown[] = []

    if (from) {
      conditions.push('open_time >= ?')
      params.push(from)
    }
    if (to) {
      conditions.push('open_time <= ?')
      params.push(to)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const offset = (page - 1) * limit

    const [countRow, rows] = await Promise.all([
      d1.first<{ total: number }>(`SELECT COUNT(*) as total FROM trades ${where}`, params),
      d1.query<TradeRow>(
        `SELECT * FROM trades ${where} ORDER BY open_time DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
    ])

    const total = countRow?.total ?? 0

    const trades = rows.map((r) => ({
      id: r.id,
      symbol: r.symbol,
      direction: r.direction,
      openPrice: r.open_price,
      closePrice: r.close_price,
      openTime: r.open_time,
      closeTime: r.close_time,
      profit: r.profit,
      volume: r.volume,
      status: r.status,
    }))

    return c.json({ trades, total, page, limit })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

export { tradesRouter }
