import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mock D1 client ---
const mockFirst = vi.fn()
const mockQuery = vi.fn()
vi.mock('../db/client', () => ({
  createD1Client: vi.fn(() => ({
    first: mockFirst,
    query: mockQuery,
    run: vi.fn(),
  })),
}))

// --- Mock fetch (Telegram sendMessage) ---
const mockFetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
vi.stubGlobal('fetch', mockFetch)

import { telegramRouter } from './telegram'

const VALID_SECRET = 'tg-secret-xyz'
const MOCK_ENV = {
  DB: {} as D1Database,
  BOT_TOKEN: 'bot-token-123',
  TELEGRAM_SECRET_TOKEN: VALID_SECRET,
}

function makeUpdate(text: string, chatId = 12345) {
  return {
    message: { chat: { id: chatId }, from: { first_name: 'Test' }, text },
  }
}

function makeReq(body: unknown, secret?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret !== undefined) headers['X-Telegram-Bot-Api-Secret-Token'] = secret
  return new Request('http://localhost/webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

// ── Auth ──────────────────────────────────────────────────────

describe('Telegram auth guard', () => {
  it('returns 401 when secret header is missing', async () => {
    const res = await telegramRouter.request('/telegram', makeReq(makeUpdate('/help')), MOCK_ENV)
    expect(res.status).toBe(401)
  })

  it('returns 401 when secret is wrong', async () => {
    const res = await telegramRouter.request('/telegram', makeReq(makeUpdate('/help'), 'bad-secret'), MOCK_ENV)
    expect(res.status).toBe(401)
  })
})

// ── /help ─────────────────────────────────────────────────────

describe('/help command', () => {
  it('sends help text and returns ok', async () => {
    const res = await telegramRouter.request('/telegram', makeReq(makeUpdate('/help'), VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)

    // Verify Telegram API was called
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('/sendMessage')
    const sent = JSON.parse(opts.body as string) as { chat_id: number; text: string }
    expect(sent.chat_id).toBe(12345)
    expect(sent.text).toContain('/status')
  })
})

// ── /status ───────────────────────────────────────────────────

describe('/status command', () => {
  it('queries DB and sends status message', async () => {
    mockFirst
      .mockResolvedValueOnce({ status: 'RUNNING', last_seen: new Date().toISOString() })
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ totalPnL: 125.5, totalClosed: 8, wins: 6 })

    const res = await telegramRouter.request('/telegram', makeReq(makeUpdate('/status'), VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(200)

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const sent = JSON.parse(opts.body as string) as { text: string }
    expect(sent.text).toContain('RUNNING')
    expect(sent.text).toContain('+125.50')
  })
})

// ── /trades ───────────────────────────────────────────────────

describe('/trades command', () => {
  it('shows open trades list', async () => {
    mockQuery.mockResolvedValue([
      { symbol: 'EURUSD', direction: 'BUY', open_price: 1.08500, volume: 0.1, open_time: '2026-06-28T10:00:00Z' },
    ])

    const res = await telegramRouter.request('/telegram', makeReq(makeUpdate('/trades'), VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(200)

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const sent = JSON.parse(opts.body as string) as { text: string }
    expect(sent.text).toContain('EURUSD')
    expect(sent.text).toContain('BUY')
  })

  it('shows empty message when no open trades', async () => {
    mockQuery.mockResolvedValue([])

    const res = await telegramRouter.request('/telegram', makeReq(makeUpdate('/trades'), VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(200)

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const sent = JSON.parse(opts.body as string) as { text: string }
    expect(sent.text).toContain('ไม่มี trade')
  })
})

// ── /today ────────────────────────────────────────────────────

describe('/today command', () => {
  it('shows today PnL', async () => {
    mockFirst.mockResolvedValue({ pnl: 45.0, count: 3 })

    const res = await telegramRouter.request('/telegram', makeReq(makeUpdate('/today'), VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(200)

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const sent = JSON.parse(opts.body as string) as { text: string }
    expect(sent.text).toContain('+45.00')
  })
})

// ── Unknown command ───────────────────────────────────────────

describe('unknown command', () => {
  it('echoes back and suggests /help', async () => {
    const res = await telegramRouter.request('/telegram', makeReq(makeUpdate('hello world'), VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(200)

    const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit]
    const sent = JSON.parse(opts.body as string) as { text: string }
    expect(sent.text).toContain('/help')
  })
})
