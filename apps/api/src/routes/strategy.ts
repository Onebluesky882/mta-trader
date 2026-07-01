import { Hono } from 'hono'
import { createAuth, authMiddleware } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'
import { createD1Client } from '../db/client'

type Bindings = { DB: D1Database; MT5_WEBHOOK_SECRET: string; GROQ_API_KEY: string }
type Variables = { user: { id: string; email: string } }

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]

type Timeframe = 'M15' | 'M30' | 'H1' | 'H4' | 'D1'
const TIMEFRAMES: Timeframe[] = ['M15', 'M30', 'H1', 'H4', 'D1']
// Bigger timeframe = stronger signal = checked first. The EA evaluates zones
// in this order regardless of how the client listed them, so e.g. an H4 zone
// always takes priority over an M30 zone when both are in range on the same tick.
const TIMEFRAME_PRIORITY: Record<Timeframe, number> = { D1: 5, H4: 4, H1: 3, M30: 2, M15: 1 }

interface ZoneRule {
  timeframe: Timeframe
  minWickTouches: number
  lookbackBars: number
  proximityPoints: number
  includeBody: boolean
}

interface StrategyParams {
  zones: ZoneRule[]
  biasToday: 'BUY' | 'SELL' | 'MIXED'
  tpPoints: number
  slPoints: number
}

const DEFAULT_ZONE: ZoneRule = {
  timeframe: 'H1', minWickTouches: 3, lookbackBars: 100, proximityPoints: 20, includeBody: false,
}

function normalizeZone(z: Partial<ZoneRule> | undefined): ZoneRule {
  return {
    timeframe: z?.timeframe && TIMEFRAMES.includes(z.timeframe) ? z.timeframe : DEFAULT_ZONE.timeframe,
    // `||` not `??`: the model sometimes returns 0 instead of omitting a
    // field, and 0 is never a sane value for any of these (0 touches always
    // matches trivially, 0 lookback scans no candles, 0 tolerance is
    // pointlessly strict) — treat it the same as "not specified".
    minWickTouches: z?.minWickTouches || DEFAULT_ZONE.minWickTouches,
    lookbackBars: z?.lookbackBars || DEFAULT_ZONE.lookbackBars,
    proximityPoints: z?.proximityPoints || DEFAULT_ZONE.proximityPoints,
    includeBody: z?.includeBody ?? DEFAULT_ZONE.includeBody,
  }
}

interface StrategyRow {
  id: string
  raw_text: string
  params: string
  is_active: number
  user_id: string
  created_at: string
  updated_at: string
}

function rowToStrategy(r: StrategyRow) {
  return {
    id: r.id,
    rawText: r.raw_text,
    params: JSON.parse(r.params) as StrategyParams,
    isActive: !!r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

async function parseStrategyText(apiKey: string, rawText: string): Promise<StrategyParams> {
  const systemPrompt = `You are a Forex trading strategy interpreter. Convert the user's free-text strategy description into a structured JSON config. The strategy can describe rules for multiple chart timeframes at once (e.g. "H4: 1 wick touch is enough" and "H1: needs 3 wicks clustered within 300 points") — extract one zone rule per timeframe mentioned. Return JSON only — no explanation outside JSON.

Required JSON structure:
{
  "zones": [
    {
      "timeframe": "M15" | "M30" | "H1" | "H4" | "D1",
      "minWickTouches": <integer, minimum number of candle wicks that must cluster together to count as a demand/supply zone on this timeframe>,
      "lookbackBars": <integer, how many recent candles to scan, default 100 if not specified>,
      "proximityPoints": <integer, how close (in points) candles must be to count as the same zone, default 20 if not specified>,
      "includeBody": <boolean, true if the strategy says to measure from both the candle body (open/close) and the wick, false if wick only>
    }
  ],
  "biasToday": "BUY" | "SELL" | "MIXED",
  "tpPoints": <integer, take profit distance in points, shared across all zones>,
  "slPoints": <integer, stop loss distance in points, shared across all zones>
}

If the strategy only mentions one timeframe, return a single-item zones array. Never return an empty zones array — if no timeframe is mentioned at all, default to one H1 zone.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      // Cheapest/lightest Groq model — this is a low-volume, low-complexity
      // parsing task (a few calls/day), no need for the 70B model.
      model: 'llama-3.1-8b-instant',
      max_tokens: 400,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: rawText },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`)

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const text = data.choices[0]?.message?.content ?? '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Groq returned no JSON')
  const parsed = JSON.parse(jsonMatch[0]) as { zones?: Partial<ZoneRule>[] } & Partial<StrategyParams>

  // Stored pre-sorted (biggest timeframe first) so any consumer — the EA,
  // future clients — can just walk the array top-to-bottom for priority order.
  const zones = (parsed.zones && parsed.zones.length > 0 ? parsed.zones : [DEFAULT_ZONE])
    .map(normalizeZone)
    .sort((a, b) => TIMEFRAME_PRIORITY[b.timeframe] - TIMEFRAME_PRIORITY[a.timeframe])

  return {
    zones,
    biasToday: parsed.biasToday && ['BUY', 'SELL', 'MIXED'].includes(parsed.biasToday) ? parsed.biasToday : 'MIXED',
    // `||` not `??` — 0-point TP/SL means "close at entry price", which the
    // broker would reject as invalid stops. Treat a 0 the model returns the
    // same as an omitted field.
    tpPoints: parsed.tpPoints || 100,
    slPoints: parsed.slPoints || 50,
  }
}

const strategyRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET /api/strategy/active — EA reads the active strategy (shared secret)
strategyRouter.get('/active', async (c) => {
  const secret = c.req.header('X-MT5-Secret')
  if (!secret || secret !== c.env.MT5_WEBHOOK_SECRET) return c.json({ error: 'Unauthorized' }, 401)

  const d1 = createD1Client(c.env.DB)
  const row = await d1.first<StrategyRow>('SELECT * FROM strategy_config WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1')
  if (!row) return c.json({ strategy: null })
  return c.json({ strategy: rowToStrategy(row) })
})

strategyRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

// GET /api/strategy — list this user's strategies
strategyRouter.get('/', async (c) => {
  const userId = c.get('user')?.id
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  try {
    const d1 = createD1Client(c.env.DB)
    const rows = await d1.query<StrategyRow>(
      'SELECT * FROM strategy_config WHERE user_id = ? ORDER BY updated_at DESC', [userId]
    )
    return c.json({ strategies: rows.map(rowToStrategy) })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// POST /api/strategy — submit strategy text, AI parses it into params
strategyRouter.post('/', async (c) => {
  const userId = c.get('user')?.id
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  let body: { rawText?: unknown }
  try { body = await c.req.json() }
  catch { return c.json({ error: 'Invalid JSON' }, 400) }

  if (typeof body.rawText !== 'string' || !body.rawText.trim()) {
    return c.json({ error: 'rawText required' }, 400)
  }

  try {
    const params = await parseStrategyText(c.env.GROQ_API_KEY, body.rawText)

    const d1 = createD1Client(c.env.DB)
    // Short id: embedded in MT5 order/deal comments, which brokers often
    // truncate around 31 chars ("STRAT:" + a full UUID would overflow that).
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
    const now = new Date().toISOString()

    await d1.run(
      `INSERT INTO strategy_config (id, raw_text, params, is_active, user_id, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
      [id, body.rawText, JSON.stringify(params), userId, now, now]
    )

    return c.json({ id, rawText: body.rawText, params, isActive: false, createdAt: now, updatedAt: now })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Strategy parsing failed' }, 500)
  }
})

// PUT /api/strategy/:id/activate — set this strategy active, deactivate the user's others
strategyRouter.put('/:id/activate', async (c) => {
  const userId = c.get('user')?.id
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  const id = c.req.param('id')

  try {
    const d1 = createD1Client(c.env.DB)
    const existing = await d1.first<StrategyRow>('SELECT id FROM strategy_config WHERE id = ? AND user_id = ?', [id, userId])
    if (!existing) return c.json({ error: 'Not found' }, 404)

    const now = new Date().toISOString()
    // Only the strategy actually being activated should get a fresh updated_at —
    // deactivating the others is a side effect of this action, not a real edit to them.
    await d1.run('UPDATE strategy_config SET is_active = 0 WHERE user_id = ? AND id != ?', [userId, id])
    await d1.run('UPDATE strategy_config SET is_active = 1, updated_at = ? WHERE id = ?', [now, id])

    return c.json({ id, isActive: true, updatedAt: now })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/strategy/:id/performance — win rate / P&L summary for one strategy
strategyRouter.get('/:id/performance', async (c) => {
  const userId = c.get('user')?.id
  if (!userId) return c.json({ error: 'Unauthorized' }, 401)
  const id = c.req.param('id')

  try {
    const d1 = createD1Client(c.env.DB)
    const strategy = await d1.first<StrategyRow>('SELECT id FROM strategy_config WHERE id = ? AND user_id = ?', [id, userId])
    if (!strategy) return c.json({ error: 'Not found' }, 404)

    const summary = await d1.first<{
      totalTrades: number
      wins: number
      totalProfit: number | null
    }>(
      `SELECT
         COUNT(*) as totalTrades,
         SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as wins,
         SUM(profit) as totalProfit
       FROM trades WHERE strategy_id = ? AND status = 'CLOSED'`,
      [id]
    )

    const totalTrades = summary?.totalTrades ?? 0
    const wins = summary?.wins ?? 0

    return c.json({
      strategyId: id,
      totalTrades,
      wins,
      losses: totalTrades - wins,
      winRate: totalTrades > 0 ? Math.round((wins / totalTrades) * 1000) / 10 : 0,
      totalProfit: summary?.totalProfit ?? 0,
    })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { strategyRouter }
