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

const dashboardRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

dashboardRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

dashboardRouter.get('/', async (c) => {
  try {
    const d1 = createD1Client(c.env.DB)
    const todayStr = new Date().toISOString().slice(0, 10)

    const [openRow, todayRow, totalsRow, botRow] = await Promise.all([
      d1.first<{ count: number }>(
        "SELECT COUNT(*) as count FROM trades WHERE status = 'OPEN'"
      ),
      d1.first<{ todayPnL: number | null }>(
        "SELECT SUM(profit) as todayPnL FROM trades WHERE status = 'CLOSED' AND close_time >= ?",
        [todayStr]
      ),
      d1.first<{ totalPnL: number | null; totalClosed: number; wins: number }>(
        `SELECT SUM(profit) as totalPnL, COUNT(*) as totalClosed,
         SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as wins
         FROM trades WHERE status = 'CLOSED'`
      ),
      d1.first<{ status: string; last_seen: string }>(
        "SELECT status, last_seen FROM bot_status WHERE id = 'singleton'"
      ),
    ])

    const openTrades = openRow?.count ?? 0
    const todayPnL = todayRow?.todayPnL ?? 0
    const totalPnL = totalsRow?.totalPnL ?? 0
    const totalClosed = totalsRow?.totalClosed ?? 0
    const wins = totalsRow?.wins ?? 0
    const winRate = totalClosed > 0 ? wins / totalClosed : 0

    let botStatus: 'RUNNING' | 'STOPPED' | 'ERROR' = 'STOPPED'
    if (botRow) {
      const stale = Date.now() - new Date(botRow.last_seen).getTime() > 5 * 60 * 1000
      botStatus = stale ? 'STOPPED' : (botRow.status as 'RUNNING' | 'STOPPED' | 'ERROR')
    }

    return c.json({ botStatus, openTrades, todayPnL, totalPnL, winRate, lastUpdated: new Date().toISOString() })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

export { dashboardRouter }
