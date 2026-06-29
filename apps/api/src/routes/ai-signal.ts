import { Hono } from 'hono'
import { createAuth, authMiddleware } from '@gover-agent/auth'
import { createDb } from '@gover-agent/db'
import { createD1Client } from '../db/client'

type Bindings = {
  DB: D1Database
  MT5_WEBHOOK_SECRET: string
  GROQ_API_KEY: string
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
}

type TFAnalysis = { trend: string; rsi: number; macd: string; ema: string }

interface GroqSignal {
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

async function callGroq(apiKey: string, prompt: string): Promise<GroqSignal> {
  const systemPrompt = `You are a professional Forex technical analyst. Analyze market data and return a trading signal in JSON format only — no explanation outside JSON.

Required JSON structure:
{
  "signal": "BUY" | "SELL" | "HOLD",
  "confidence": <integer 0-100>,
  "reason": "<Thai language explanation, 2-4 sentences>",
  "sl": <stop loss price as number or null>,
  "tp": <take profit price as number or null>,
  "h4": { "trend": "<string>", "rsi": <number>, "macd": "<string>", "ema": "<string>" },
  "h1": { "trend": "<string>", "rsi": <number>, "macd": "<string>", "ema": "<string>" }
}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`)

  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const text = data.choices[0]?.message?.content ?? '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Groq returned no JSON')
  return JSON.parse(jsonMatch[0]) as GroqSignal
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
    lines.push('\nNo real-time candle data — give a general technical outlook for this symbol.')
  }

  lines.push('\nProvide a trading signal with SL/TP levels based on this data.')
  return lines.join('\n')
}

const aiSignalRouter = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// POST /api/ai-signal/analyze — EA (X-MT5-Secret) or web (Bearer)
aiSignalRouter.post('/analyze', async (c) => {
  const mtSecret = c.req.header('X-MT5-Secret')
  const isMT5 = !!mtSecret && mtSecret === c.env.MT5_WEBHOOK_SECRET

  if (!isMT5) {
    const db = createDb(c.env.DB)
    const auth = createAuth(db, TRUSTED_ORIGINS)
    let authed = false
    await authMiddleware(auth)(c, async () => { authed = true })
    if (!authed) return c.json({ error: 'Unauthorized' }, 401)
  }

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

    const result = await callGroq(c.env.GROQ_API_KEY, prompt)

    if (!['BUY', 'SELL', 'HOLD'].includes(result.signal)) result.signal = 'HOLD'
    result.confidence = Math.max(0, Math.min(100, result.confidence ?? 50))

    const d1 = createD1Client(c.env.DB)
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const price = typeof body.currentPrice === 'number' ? body.currentPrice : null

    await d1.run(
      `INSERT INTO ai_signals (id, symbol, signal, confidence, reason, sl, tp, price, h4_analysis, h1_analysis, analyzed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, body.symbol, result.signal, result.confidence, result.reason ?? '', result.sl ?? null, result.tp ?? null, price, JSON.stringify(result.h4 ?? {}), JSON.stringify(result.h1 ?? {}), now]
    )

    return c.json({ id, symbol: body.symbol, signal: result.signal, confidence: result.confidence, reason: result.reason, sl: result.sl, tp: result.tp, price, h4: result.h4, h1: result.h1, analyzedAt: now })
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : 'Analysis failed' }, 500)
  }
})

aiSignalRouter.use('*', async (c, next) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return authMiddleware(auth)(c, next)
})

aiSignalRouter.get('/latest', async (c) => {
  try {
    const d1 = createD1Client(c.env.DB)
    const row = await d1.first<SignalRow>('SELECT * FROM ai_signals ORDER BY analyzed_at DESC LIMIT 1')
    if (!row) return c.json({ signal: null })
    return c.json({ signal: rowToSignal(row) })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

aiSignalRouter.get('/history', async (c) => {
  try {
    const d1 = createD1Client(c.env.DB)
    const rows = await d1.query<SignalRow>('SELECT * FROM ai_signals ORDER BY analyzed_at DESC LIMIT 20')
    return c.json({ signals: rows.map(rowToSignal) })
  } catch {
    return c.json({ error: 'Internal server error' }, 500)
  }
})

export { aiSignalRouter }
