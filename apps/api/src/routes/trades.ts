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

const tradesRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

tradesRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

tradesRouter.get('/', async (c) => {
  const user = c.get('user') as { id: string }
  const userId = user.id

  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10))
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query('limit') ?? '50', 10)))
  const from = c.req.query('from')
  const to = c.req.query('to')

  if (isNaN(page)) return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  if (from && isNaN(Date.parse(from))) return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  if (to && isNaN(Date.parse(to))) return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)

  try {
    const d1 = createD1Client(c.env.DB)
    const conditions: string[] = ['user_id = ?']
    const params: unknown[] = [userId]

    if (from) { conditions.push('open_time >= ?'); params.push(from) }
    if (to) { conditions.push('open_time <= ?'); params.push(to) }

    const where = `WHERE ${conditions.join(' AND ')}`
    const offset = (page - 1) * limit

    const [countRow, rows] = await Promise.all([
      d1.first<{ total: number }>(`SELECT COUNT(*) as total FROM trades ${where}`, params),
      d1.query<TradeRow>(
        `SELECT * FROM trades ${where} ORDER BY open_time DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      ),
    ])

    const trades = rows.map(r => ({
      id: r.id, symbol: r.symbol, direction: r.direction,
      openPrice: r.open_price, closePrice: r.close_price,
      openTime: r.open_time, closeTime: r.close_time,
      profit: r.profit, volume: r.volume, status: r.status,
    }))

    return c.json({ trades, total: countRow?.total ?? 0, page, limit })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

export { tradesRouter }
