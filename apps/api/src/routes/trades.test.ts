import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mock auth ---
const mockGetSession = vi.fn()
vi.mock('@gover-agent/auth', () => ({
  createAuth: vi.fn(() => ({ api: { getSession: mockGetSession } })),
  authMiddleware: vi.fn((auth: { api: { getSession: typeof mockGetSession } }) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (c: any, next: () => Promise<void>) => {
      const session = await auth.api.getSession({ headers: c.req.raw.headers })
      if (!session) return c.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)
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
vi.mock('../db/client', () => ({
  createD1Client: vi.fn(() => ({
    first: mockFirst,
    query: mockQuery,
    run: vi.fn(),
  })),
}))

import { tradesRouter } from './trades'

const MOCK_ENV = { DB: {} as D1Database }
const mockUser = { id: 'user-1', email: 'test@example.com' }

const SAMPLE_TRADE = {
  id: 'trade-1',
  symbol: 'EURUSD',
  direction: 'BUY',
  open_price: 1.1,
  close_price: 1.12,
  open_time: '2026-01-01T00:00:00Z',
  close_time: '2026-01-01T01:00:00Z',
  profit: 20,
  volume: 0.1,
  status: 'CLOSED',
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/trades', () => {
  it('returns 200 with paginated trade list when authenticated', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockFirst.mockResolvedValue({ total: 1 })
    mockQuery.mockResolvedValue([SAMPLE_TRADE])

    const req = new Request('http://localhost/?page=1&limit=10', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await tradesRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(200)
    const body = await res.json() as {
      trades: unknown[]
      total: number
      page: number
      limit: number
    }
    expect(body.trades).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.limit).toBe(10)

    const trade = body.trades[0] as Record<string, unknown>
    expect(trade.id).toBe('trade-1')
    expect(trade.openPrice).toBe(1.1)
    expect(trade.symbol).toBe('EURUSD')
  })

  it('returns 401 when no Bearer token', async () => {
    mockGetSession.mockResolvedValue(null)

    const req = new Request('http://localhost/')
    const res = await tradesRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(401)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('returns 400 for invalid page parameter', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })

    const req = new Request('http://localhost/?page=abc', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await tradesRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(400)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INVALID_PARAMS')
  })

  it('returns 400 for invalid date param', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })

    const req = new Request('http://localhost/?from=not-a-date', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await tradesRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(400)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INVALID_PARAMS')
  })
})
