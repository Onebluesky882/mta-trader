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
const mockRun = vi.fn()
vi.mock('../db/client', () => ({
  createD1Client: vi.fn(() => ({
    first: mockFirst,
    query: vi.fn(),
    run: mockRun,
  })),
}))

import { settingsRouter } from './settings'

const MOCK_ENV = { DB: {} as D1Database }
const mockUser = { id: 'user-1', email: 'test@example.com' }

const SAMPLE_SETTINGS = {
  id: 'settings-1',
  version: 3,
  params: JSON.stringify({ rsiPeriod: 14, lotSize: 0.01 }),
  updated_at: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => vi.clearAllMocks())

describe('GET /api/settings', () => {
  it('returns 200 with current settings when authenticated', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockFirst.mockResolvedValue(SAMPLE_SETTINGS)

    const req = new Request('http://localhost/', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await settingsRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(200)
    const body = await res.json() as {
      id: string
      version: number
      params: Record<string, unknown>
      updatedAt: string
    }
    expect(body.id).toBe('settings-1')
    expect(body.version).toBe(3)
    expect(body.params).toEqual({ rsiPeriod: 14, lotSize: 0.01 })
  })

  it('creates default settings when none exist', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockFirst.mockResolvedValue(null)
    mockRun.mockResolvedValue(undefined)

    const req = new Request('http://localhost/', {
      headers: { Authorization: 'Bearer valid-token' },
    })
    const res = await settingsRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(200)
    expect(mockRun).toHaveBeenCalledOnce()
    const body = await res.json() as { version: number; params: Record<string, unknown> }
    expect(body.version).toBe(1)
    expect(typeof body.params.rsiPeriod).toBe('number')
  })

  it('returns 401 when no Bearer token', async () => {
    mockGetSession.mockResolvedValue(null)

    const req = new Request('http://localhost/')
    const res = await settingsRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(401)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('UNAUTHORIZED')
  })
})

describe('PUT /api/settings', () => {
  it('returns 200 with updated settings', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })
    mockFirst.mockResolvedValue(SAMPLE_SETTINGS)
    mockRun.mockResolvedValue(undefined)

    const req = new Request('http://localhost/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ params: { rsiPeriod: 20, lotSize: 0.02 } }),
    })
    const res = await settingsRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(200)
    const body = await res.json() as {
      version: number
      params: Record<string, unknown>
    }
    expect(body.version).toBe(4) // SAMPLE_SETTINGS.version + 1
    expect(body.params).toEqual({ rsiPeriod: 20, lotSize: 0.02 })
  })

  it('returns 401 when no Bearer token', async () => {
    mockGetSession.mockResolvedValue(null)

    const req = new Request('http://localhost/', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: {} }),
    })
    const res = await settingsRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(401)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('returns 400 when params field is missing', async () => {
    mockGetSession.mockResolvedValue({ user: mockUser })

    const req = new Request('http://localhost/', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ notParams: 'wrong' }),
    })
    const res = await settingsRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(400)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INVALID_PARAMS')
  })
})
