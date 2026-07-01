import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// --- Mock auth ---
const mockGetSession = vi.fn()
vi.mock('@gover-agent/auth', () => ({
  createAuth: vi.fn(() => ({ api: { getSession: mockGetSession } })),
  authMiddleware: vi.fn((auth: { api: { getSession: typeof mockGetSession } }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (c: any, next: () => Promise<void>) => {
      const session = await auth.api.getSession({ headers: c.req.raw.headers })
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      c.set('user', session.user)
      await next()
    }
  ),
}))

vi.mock('@gover-agent/db', () => ({
  createDb: vi.fn(() => ({})),
}))

// --- Mock D1 client ---
const mockFirst = vi.fn()
const mockQuery = vi.fn()
const mockRun = vi.fn()
vi.mock('../db/client', () => ({
  createD1Client: vi.fn(() => ({
    first: mockFirst,
    query: mockQuery,
    run: mockRun,
  })),
}))

import { strategyRouter } from './strategy'

const MOCK_ENV = { DB: {} as D1Database, MT5_WEBHOOK_SECRET: 'test-secret', GROQ_API_KEY: 'groq-key' }
const mockUser = { id: 'user-1', email: 'test@example.com' }

const SAMPLE_ROW = {
  id: 'abc123def456',
  raw_text: 'lower wick cluster at 4042, 5 touches, buy when price returns',
  params: JSON.stringify({
    timeframe: 'M15', minWickTouches: 5, lookbackBars: 100, proximityPoints: 20,
    biasToday: 'BUY', tpPoints: 300, slPoints: 150,
  }),
  is_active: 1,
  user_id: 'user-1',
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
}

function authedReq(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: 'Bearer valid-token' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── GET /active (MT5 secret, no user auth) ──────────────────────

describe('GET /active', () => {
  it('returns 401 when secret is missing or wrong', async () => {
    const res1 = await strategyRouter.request('/active', {}, MOCK_ENV)
    expect(res1.status).toBe(401)

    const res2 = await strategyRouter.request('/active', { headers: { 'X-MT5-Secret': 'wrong' } }, MOCK_ENV)
    expect(res2.status).toBe(401)
  })

  it('returns { strategy: null } when no active strategy exists', async () => {
    mockFirst.mockResolvedValue(null)
    const res = await strategyRouter.request('/active', { headers: { 'X-MT5-Secret': 'test-secret' } }, MOCK_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as { strategy: unknown }
    expect(body.strategy).toBeNull()
  })

  it('returns the active strategy with parsed params', async () => {
    mockFirst.mockResolvedValue(SAMPLE_ROW)
    const res = await strategyRouter.request('/active', { headers: { 'X-MT5-Secret': 'test-secret' } }, MOCK_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as { strategy: { id: string; params: { biasToday: string; minWickTouches: number } } }
    expect(body.strategy.id).toBe('abc123def456')
    expect(body.strategy.params.biasToday).toBe('BUY')
    expect(body.strategy.params.minWickTouches).toBe(5)
  })
})

// ── POST / (user auth + Groq parsing) ───────────────────────────

describe('POST /', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await strategyRouter.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: 'buy at demand zone' }),
    }, MOCK_ENV)
    expect(res.status).toBe(401)
  })

  it('returns 400 when rawText is missing', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    const res = await strategyRouter.request('/', authedReq('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }), MOCK_ENV)
    expect(res.status).toBe(400)
  })

  it('parses strategy text via Groq and saves it', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockRun.mockResolvedValue(undefined)

    const groqPayload = {
      timeframe: 'M30', minWickTouches: 5, lookbackBars: 100, proximityPoints: 20,
      biasToday: 'BUY', tpPoints: 300, slPoints: 150,
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(groqPayload) } }],
      }), { status: 200 })
    ))

    const res = await strategyRouter.request('/', authedReq('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: 'lower wick cluster at 4042, 5 touches, buy on return' }),
    }), MOCK_ENV)

    expect(res.status).toBe(200)
    const body = await res.json() as { params: typeof groqPayload; isActive: boolean }
    expect(body.params).toEqual(groqPayload)
    expect(body.isActive).toBe(false)
    expect(mockRun).toHaveBeenCalledOnce()
  })

  it('falls back to defaults when Groq omits fields', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockRun.mockResolvedValue(undefined)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: '{"biasToday":"SELL"}' } }],
      }), { status: 200 })
    ))

    const res = await strategyRouter.request('/', authedReq('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: 'sell when price rejects resistance' }),
    }), MOCK_ENV)

    expect(res.status).toBe(200)
    const body = await res.json() as { params: { timeframe: string; biasToday: string; minWickTouches: number; tpPoints: number; slPoints: number } }
    expect(body.params.timeframe).toBe('H1')
    expect(body.params.biasToday).toBe('SELL')
    expect(body.params.minWickTouches).toBe(3)
    expect(body.params.tpPoints).toBe(100)
    expect(body.params.slPoints).toBe(50)
  })

  it('returns 500 when Groq API call fails', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))

    const res = await strategyRouter.request('/', authedReq('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: 'buy at demand zone' }),
    }), MOCK_ENV)

    expect(res.status).toBe(500)
  })

  it('falls back to H1 when Groq returns an invalid timeframe', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockRun.mockResolvedValue(undefined)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        choices: [{ message: { content: '{"timeframe":"M5","biasToday":"BUY"}' } }],
      }), { status: 200 })
    ))

    const res = await strategyRouter.request('/', authedReq('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: 'buy at demand zone on the 5 minute chart' }),
    }), MOCK_ENV)

    expect(res.status).toBe(200)
    const body = await res.json() as { params: { timeframe: string } }
    expect(body.params.timeframe).toBe('H1')
  })
})

// ── GET / (list) ─────────────────────────────────────────────────

describe('GET /', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await strategyRouter.request('/', authedReq('/'), MOCK_ENV)
    expect(res.status).toBe(401)
  })

  it("returns the user's strategies", async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockQuery.mockResolvedValue([SAMPLE_ROW])

    const res = await strategyRouter.request('/', authedReq('/'), MOCK_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as { strategies: Array<{ id: string }> }
    expect(body.strategies).toHaveLength(1)
    expect(body.strategies[0].id).toBe('abc123def456')
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['user-1'])
  })
})

// ── PUT /:id/activate ─────────────────────────────────────────────

describe('PUT /:id/activate', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await strategyRouter.request('/abc123def456/activate', authedReq('/abc123def456/activate', { method: 'PUT' }), MOCK_ENV)
    expect(res.status).toBe(401)
  })

  it('returns 404 when the strategy does not belong to the user', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockFirst.mockResolvedValue(null)

    const res = await strategyRouter.request('/nope/activate', authedReq('/nope/activate', { method: 'PUT' }), MOCK_ENV)
    expect(res.status).toBe(404)
  })

  it('deactivates other strategies and activates this one', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockFirst.mockResolvedValue({ id: 'abc123def456' })
    mockRun.mockResolvedValue(undefined)

    const res = await strategyRouter.request('/abc123def456/activate', authedReq('/abc123def456/activate', { method: 'PUT' }), MOCK_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as { isActive: boolean }
    expect(body.isActive).toBe(true)
    expect(mockRun).toHaveBeenCalledTimes(2)
  })
})

// ── GET /:id/performance ──────────────────────────────────────────

describe('GET /:id/performance', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await strategyRouter.request('/abc123def456/performance', authedReq('/abc123def456/performance'), MOCK_ENV)
    expect(res.status).toBe(401)
  })

  it('returns 404 when the strategy does not belong to the user', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockFirst.mockResolvedValue(null)

    const res = await strategyRouter.request('/nope/performance', authedReq('/nope/performance'), MOCK_ENV)
    expect(res.status).toBe(404)
  })

  it('computes win rate and total profit', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockFirst
      .mockResolvedValueOnce({ id: 'abc123def456' })
      .mockResolvedValueOnce({ totalTrades: 4, wins: 3, totalProfit: 250.5 })

    const res = await strategyRouter.request('/abc123def456/performance', authedReq('/abc123def456/performance'), MOCK_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as {
      totalTrades: number; wins: number; losses: number; winRate: number; totalProfit: number
    }
    expect(body.totalTrades).toBe(4)
    expect(body.wins).toBe(3)
    expect(body.losses).toBe(1)
    expect(body.winRate).toBe(75)
    expect(body.totalProfit).toBe(250.5)
  })

  it('returns zeros when there are no closed trades yet', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockFirst
      .mockResolvedValueOnce({ id: 'abc123def456' })
      .mockResolvedValueOnce({ totalTrades: 0, wins: 0, totalProfit: null })

    const res = await strategyRouter.request('/abc123def456/performance', authedReq('/abc123def456/performance'), MOCK_ENV)
    expect(res.status).toBe(200)
    const body = await res.json() as { totalTrades: number; winRate: number; totalProfit: number }
    expect(body.totalTrades).toBe(0)
    expect(body.winRate).toBe(0)
    expect(body.totalProfit).toBe(0)
  })
})
