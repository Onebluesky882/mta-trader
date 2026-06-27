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

// --- Mock DB ---
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

import { dashboardRouter } from './dashboard'

const MOCK_ENV = { DB: {} as D1Database }

const mockUser = { id: 'user-1', email: 'test@example.com' }

beforeEach(() => {
  vi.clearAllMocks()
  mockFirst
    .mockResolvedValueOnce({ count: 3 })           // open trades
    .mockResolvedValueOnce({ todayPnL: 150.5 })    // today PnL
    .mockResolvedValueOnce({ totalPnL: 500, totalClosed: 10, wins: 7 }) // totals
})

describe('GET /api/dashboard', () => {
  it('returns 200 with dashboard stats when authenticated', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })

    const req = new Request('http://localhost/', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await dashboardRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(200)
    const body = await res.json() as {
      botStatus: string
      openTrades: number
      todayPnL: number
      totalPnL: number
      winRate: number
      lastUpdated: string
    }
    expect(body.botStatus).toBe('RUNNING')
    expect(body.openTrades).toBe(3)
    expect(body.todayPnL).toBe(150.5)
    expect(body.totalPnL).toBe(500)
    expect(body.winRate).toBeCloseTo(0.7)
    expect(typeof body.lastUpdated).toBe('string')
  })

  it('returns 401 when no Bearer token', async () => {
    mockGetSession.mockResolvedValue(null)

    const req = new Request('http://localhost/')
    const res = await dashboardRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(401)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('UNAUTHORIZED')
  })
})
