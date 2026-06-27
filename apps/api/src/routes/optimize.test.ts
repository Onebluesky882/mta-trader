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
const mockRun = vi.fn()
vi.mock('../db/client', () => ({
  createD1Client: vi.fn(() => ({
    first: mockFirst,
    query: mockQuery,
    run: mockRun,
  })),
}))

import { optimizeRouter } from './optimize'

const MOCK_ENV = { DB: {} as D1Database }
const mockUser = { id: 'user-1', email: 'test@example.com' }

const SAMPLE_RESULT = {
  totalTrades: 100,
  winRate: 0.65,
  totalProfit: 1500,
  maxDrawdown: 200,
  sharpeRatio: 1.2,
}

const SAMPLE_SNAPSHOT = {
  id: 'snap-1',
  version: 1,
  params: JSON.stringify({ rsiPeriod: 14 }),
  result: JSON.stringify(SAMPLE_RESULT),
  label: 'v1 test',
  created_at: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/optimize', () => {
  it('returns 200 with snapshot list when authenticated', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockQuery.mockResolvedValue([SAMPLE_SNAPSHOT])

    const req = new Request('http://localhost/', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await optimizeRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(200)
    const body = await res.json() as { snapshots: unknown[] }
    expect(body.snapshots).toHaveLength(1)

    const snap = body.snapshots[0] as Record<string, unknown>
    expect(snap.id).toBe('snap-1')
    expect(snap.version).toBe(1)
    expect(snap.label).toBe('v1 test')
    expect((snap.result as Record<string, unknown>).winRate).toBe(0.65)
  })

  it('returns 401 when no Bearer token', async () => {
    mockGetSession.mockResolvedValue(null)

    const req = new Request('http://localhost/')
    const res = await optimizeRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(401)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('UNAUTHORIZED')
  })
})

describe('POST /api/optimize', () => {
  const validBody = {
    params: { rsiPeriod: 14 },
    result: SAMPLE_RESULT,
    label: 'test run',
  }

  it('returns 201 with created snapshot when authenticated', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockFirst.mockResolvedValue({ version: 2 }) // latest version
    mockRun.mockResolvedValue(undefined)

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(validBody),
    })
    const res = await optimizeRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(201)
    const body = await res.json() as {
      version: number
      params: Record<string, unknown>
      result: Record<string, unknown>
      label: string
    }
    expect(body.version).toBe(3) // 2 + 1
    expect(body.params).toEqual({ rsiPeriod: 14 })
    expect(body.result.winRate).toBe(0.65)
    expect(body.label).toBe('test run')
  })

  it('returns 401 when no Bearer token', async () => {
    mockGetSession.mockResolvedValue(null)

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validBody),
    })
    const res = await optimizeRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(401)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('returns 400 when params is missing', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ result: SAMPLE_RESULT }),
    })
    const res = await optimizeRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(400)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INVALID_PARAMS')
  })

  it('returns 400 when result fields are invalid', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })

    const req = new Request('http://localhost/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        params: { rsiPeriod: 14 },
        result: { totalTrades: 'not-a-number' }, // wrong type
      }),
    })
    const res = await optimizeRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(400)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INVALID_PARAMS')
  })
})
