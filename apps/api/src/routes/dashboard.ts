import { Hono } from 'hono'
import { createAuth, authMiddleware } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'
import { createD1Client } from '../db/client'

type Bindings = { DB: D1Database }

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
]

const dashboardRouter = new Hono<{ Bindings: Bindings }>()

// Apply auth middleware to all dashboard routes
dashboardRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

/**
 * GET /api/dashboard
 * Returns bot status, open trade count, today's PnL, total PnL, win rate
 */
dashboardRouter.get('/', async (c) => {
  try {
    const d1 = createD1Client(c.env.DB)

    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    const todayStr = todayStart.toISOString().slice(0, 10)

    const [openRow, todayRow, totalsRow] = await Promise.all([
      // Count of open trades
      d1.first<{ count: number }>(
        'SELECT COUNT(*) as count FROM trades WHERE status = ?',
        ['OPEN']
      ),
      // Today's closed profit
      d1.first<{ todayPnL: number | null }>(
        "SELECT SUM(profit) as todayPnL FROM trades WHERE status = 'CLOSED' AND close_time >= ?",
        [todayStr]
      ),
      // All-time stats for win rate and total PnL
      d1.first<{ totalPnL: number | null; totalClosed: number; wins: number }>(
        `SELECT
          SUM(profit) as totalPnL,
          COUNT(*) as totalClosed,
          SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as wins
        FROM trades WHERE status = 'CLOSED'`
      ),
    ])

    const openTrades = openRow?.count ?? 0
    const todayPnL = todayRow?.todayPnL ?? 0
    const totalPnL = totalsRow?.totalPnL ?? 0
    const totalClosed = totalsRow?.totalClosed ?? 0
    const wins = totalsRow?.wins ?? 0
    const winRate = totalClosed > 0 ? wins / totalClosed : 0

    return c.json({
      botStatus: 'RUNNING' as 'RUNNING' | 'STOPPED' | 'ERROR',
      openTrades,
      todayPnL,
      totalPnL,
      winRate,
      lastUpdated: new Date().toISOString(),
    })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

export { dashboardRouter }
