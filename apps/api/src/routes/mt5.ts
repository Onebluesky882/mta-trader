import { Hono } from 'hono'
import { createD1Client } from '../db/client'

type Bindings = {
  DB: D1Database
  MT5_WEBHOOK_SECRET: string
}

const mt5Router = new Hono<{ Bindings: Bindings }>()

function verifySecret(secret: string | undefined, env: Bindings): boolean {
  return !!secret && secret === env.MT5_WEBHOOK_SECRET
}

/**
 * POST /api/mt5/trade-open
 * Called by MT5 EA when a new trade is opened
 */
mt5Router.post('/trade-open', async (c) => {
  if (!verifySecret(c.req.header('X-MT5-Secret'), c.env)) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
  }

  let body: {
    ticket?: unknown
    symbol?: unknown
    direction?: unknown
    openPrice?: unknown
    volume?: unknown
    openTime?: unknown
  }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON', code: 'INVALID_PARAMS' }, 400)
  }

  const { ticket, symbol, direction, openPrice, volume, openTime } = body

  if (
    typeof ticket !== 'number' ||
    typeof symbol !== 'string' ||
    (direction !== 'BUY' && direction !== 'SELL') ||
    typeof openPrice !== 'number' ||
    typeof volume !== 'number' ||
    typeof openTime !== 'string'
  ) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  try {
    const d1 = createD1Client(c.env.DB)
    const id = String(ticket)

    await d1.run(
      `INSERT INTO trades (id, symbol, direction, open_price, volume, open_time, status)
       VALUES (?, ?, ?, ?, ?, ?, 'OPEN')
       ON CONFLICT(id) DO NOTHING`,
      [id, symbol, direction, openPrice, volume, openTime]
    )

    return c.json({ success: true, id }, 201)
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

/**
 * POST /api/mt5/trade-close
 * Called by MT5 EA when a trade is closed
 */
mt5Router.post('/trade-close', async (c) => {
  if (!verifySecret(c.req.header('X-MT5-Secret'), c.env)) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
  }

  let body: {
    ticket?: unknown
    closePrice?: unknown
    closeTime?: unknown
    profit?: unknown
  }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON', code: 'INVALID_PARAMS' }, 400)
  }

  const { ticket, closePrice, closeTime, profit } = body

  if (
    typeof ticket !== 'number' ||
    typeof closePrice !== 'number' ||
    typeof closeTime !== 'string' ||
    typeof profit !== 'number'
  ) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  try {
    const d1 = createD1Client(c.env.DB)
    const id = String(ticket)

    const existing = await d1.first<{ id: string }>(
      'SELECT id FROM trades WHERE id = ?',
      [id]
    )

    if (!existing) {
      return c.json({ error: 'Trade not found', code: 'NOT_FOUND' }, 404)
    }

    await d1.run(
      `UPDATE trades
       SET close_price = ?, close_time = ?, profit = ?, status = 'CLOSED'
       WHERE id = ?`,
      [closePrice, closeTime, profit, id]
    )

    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

/**
 * POST /api/mt5/heartbeat
 * Called periodically by MT5 EA to signal bot is alive
 */
mt5Router.post('/heartbeat', async (c) => {
  if (!verifySecret(c.req.header('X-MT5-Secret'), c.env)) {
    return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
  }

  let body: { status?: unknown; timestamp?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON', code: 'INVALID_PARAMS' }, 400)
  }

  const { status, timestamp } = body

  if (
    (status !== 'RUNNING' && status !== 'STOPPED' && status !== 'ERROR') ||
    typeof timestamp !== 'string'
  ) {
    return c.json({ error: 'Invalid parameters', code: 'INVALID_PARAMS' }, 400)
  }

  try {
    const d1 = createD1Client(c.env.DB)

    await d1.run(
      `INSERT INTO bot_status (id, status, last_seen) VALUES ('singleton', ?, ?)
       ON CONFLICT(id) DO UPDATE SET status = excluded.status, last_seen = excluded.last_seen`,
      [status, timestamp]
    )

    return c.json({ success: true })
  } catch {
    return c.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, 500)
  }
})

export { mt5Router }
