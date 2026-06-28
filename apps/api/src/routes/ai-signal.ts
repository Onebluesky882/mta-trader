import { Hono } from 'hono'
import { createAuth, authMiddleware } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'
import { createD1Client } from '../db/client'

type Bindings = {
  DB: D1Database
  ANTHROPIC_API_KEY: string
}
type Variables = { user: { id: string; email: string } }

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
]

interface SignalRow {
  id: string
  symbol: string
  signal: string
  confidence: number
  reason: string
  sl: number | null
  tp: number | null
  price: number | null
  h4_analysis: string
  h1_analysis: string
  analyzed_at: string
  user_id: string
}

type TFAnalysis = { trend: string; rsi: number; macd: string; ema: string }

interface ClaudeSignal {
  signal: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reason: string
  sl: number | null
  tp: number | null
  h4: TFAnalysis
  h1: TFAnalysis
}

function rowToSignal(r: SignalRow) {
  return {
    id: r.id, symbol: r.symbol,
    signal: r.signal as 'BUY' | 'SELL' | 'HOLD',
    confidence: r.confidence, reason: r.reason,
    sl: r.sl, tp: r.tp, price: r.price,
    h4: JSON.parse(r.h4_analysis) as TFAnalysis,
    h1: JSON.parse(r.h1_analysis) as TFAnalysis,
    analyzedAt: r.analyzed_at,
  }
}

async function callClaude(apiKey: string, prompt: string): Promise<ClaudeSignal> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: `You are a professional Forex technical analyst. Analyze market data and return a trading signal in JSON format only — no explanation outside JSON.

Required JSON structure:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": <integer 0-100>,
  "reason": "<Thai language explanation, 2-4 sentences>",
  "sl": <stop loss price as number or null>,
  "tp": <take profit price as number or null>,
  "h4": { "trend": "<string>", "rsi": <number>, "macd": "<string>", "ema": "<string>" },
  "h1": { "trend": "<string>", "rsi": <number>, "macd": "<string>", "ema": "<string>" }
}`,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`)

  const data = await res.json() as { content: Array<{ type: string; text: string }> }
  const text = data.content.find(b => b.type === 'text')?.text ?? '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude returned no JSON')
  return JSON.parse(jsonMatch[0]) as ClaudeSignal
}

function buildPrompt(body: {
  symbol: string
  currentPrice?: number
  h4Candles?: Array<{ open: number; high: number; low: number; close: number; time: string }>
  h1Candles?: Array<{ open: number; high: number; low: number; close: number; time: string }>
  h4Indicators?: { rsi: number; macdHistogram: number; ema50: number; ema200: number }
  h1Indicators?: { rsi: number; macdHistogram: number; ema21: number }
}): string {
  const lines: string[] = [`Symbol: ${body.symbol}`]
  if (body.currentPrice) lines.push(`Current Price: ${body.currentPrice}`)

  if (body.h4Indicators) {
    const i = body.h4Indicators
    lines.push(`\nH4 Indicators:\n- RSI: ${i.rsi}\n- MACD Histogram: ${i.macdHistogram}\n- EMA 50: ${i.ema50}\n- EMA 200: ${i.ema200}`)
  } else if (body.h4Candles?.length) {
    const last5 = body.h4Candles.slice(-5)
    lines.push(`\nH4 Candles (last ${last5.length}):\n${last5.map(c => `  ${c.time} O:${c.open} H:${c.high} L:${c.low} C:${c.close}`).join('\n')}`)
  }

  if (body.h1Indicators) {
    const i = body.h1Indicators
    lines.push(`\nH1 Indicators:\n- RSI: ${i.rsi}\n- MACD Histogram: ${i.macdHistogram}\n- EMA 21: ${i.ema21}`)
  } else if (body.h1Candles?.length) {
    const last5 = body.h1Candles.slice(-5)
    lines.push(`\nH1 Candles (last ${last5.length}):\n${last5.map(c => `  ${c.time} O:${c.open} H:${c.high} L:${c.low} C:${c.close}`).join('\n')}`)
  }

  if (!body.h4Indicators && !body.h4Candles && !body.h1Indicators && !body.h1Candles) {
    lines.push('\nNo real-time candle data provided — give a general technical outlook based on current market session.')
  }

  lines.push('\nProvide a trading signal with SL/TP levels based on this data.')
  return lines.join('\n')
}

const aiSignalRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// POST /api/ai-signal/analyze — EA (X-MT5-Secret) or web (Bearer)
aiSignalRouter.post('/analyze', async (c) => {
  const d1 = createD1Client(c.env.DB)
  let userId: string | null = null

  const mtSecret = c.req.header('X-MT5-Secret')
  if (mtSecret) {
    const keyRow = await d1.first<{ user_id: string }>(
      'SELECT user_id FROM user_api_keys WHERE api_key = ?', [mtSecret]
    )
    userId = keyRow?.user_id ?? null
  }

  if (!userId) {
    // Try Bearer auth
    const db = createDb(c.env.DB)
    const auth = createAuth(db, TRUSTED_ORIGINS)
    await authMiddleware(auth)(c, async () => {
      const u = c.get('user')
      if (u?.id) userId = u.id
    })
  }

  if (!userId) return c.json({ error: 'Unauthorized' }, 401)

  let body: { symbol?: unknown; currentPrice?: unknown; h4Candles?: unknown; h1Candles?: unknown; h4Indicators?: unknown; h1Indicators?: unknown }
  try { body = await c.req.json() }
  catch { return c.json({ error: 'Invalid JSON' }, 400) }

  if (typeof body.symbol !== 'string') return c.json({ error: 'symbol required' }, 400)

  try {
    const prompt = buildPrompt({
      symbol: body.symbol,
      currentPrice: typeof body.currentPrice === 'number' ? body.currentPrice : undefined,
      h4Candles: Array.isArray(body.h4Candles) ? body.h4Candles as never : undefined,
      h1Candles: Array.isArray(body.h1Candles) ? body.h1Candles as never : undefined,
      h4Indicators: body.h4Indicators && typeof body.h4Indicators === 'object' ? body.h4Indicators as never : undefined,
      h1Indicators: body.h1Indicators && typeof body.h1Indicators === 'object' ? body.h1Indicators as never : undefined,
    })

    const result = await callClaude(c.env.ANTHROPIC_API_KEY, prompt)

    if (!['BUY', 'SELL', 'HOLD'].includes(result.signal)) result.signal = 'HOLD'
    result.confidence = Math.max(0, Math.min(100, result.confidence ?? 50))

    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const price = typeof body.currentPrice === 'number' ? body.currentPrice : null

    await d1.run(
      `INSERT INTO ai_signals (id, symbol, signal, confidence, reason, sl, tp, price, h4_analysis, h1_analysis, analyzed_at, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, body.symbol, result.signal, result.confidence,
        result.reason ?? '',
        result.sl ?? null, result.tp ?? null, price,
        JSON.stringify(result.h4 ?? {}),
        JSON.stringify(result.h1 ?? {}),
        now, userId,
      ]
    )

    return c.json({ id, symbol: body.symbol, signal: result.signal, confidence: result.confidence, reason: result.reason, sl: result.sl, tp: result.tp, price, h4: result.h4, h1: result.h1, analyzedAt: now })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Analysis failed' }, 500)
  }
})

// Apply auth for remaining endpoints
aiSignalRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

// GET /api/ai-signal/latest
aiSignalRouter.get('/latest', async (c) => {
  const user = c.get('user') as { id: string }
  const userId = user.id
  try {
    const d1 = createD1Client(c.env.DB)
    const row = await d1.first<SignalRow>(
      'SELECT * FROM ai_signals WHERE user_id = ? ORDER BY analyzed_at DESC LIMIT 1', [userId]
    )
    if (!row) return c.json({ signal: null })
    return c.json({ signal: rowToSignal(row) })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// GET /api/ai-signal/history
aiSignalRouter.get('/history', async (c) => {
  const user = c.get('user') as { id: string }
  const userId = user.id
  try {
    const d1 = createD1Client(c.env.DB)
    const rows = await d1.query<SignalRow>(
      'SELECT * FROM ai_signals WHERE user_id = ? ORDER BY analyzed_at DESC LIMIT 20', [userId]
    )
    return c.json({ signals: rows.map(rowToSignal) })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { aiSignalRouter }
