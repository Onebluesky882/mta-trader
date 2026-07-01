import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import { mt5Router } from './mt5'

const VALID_SECRET = 'test-secret-abc'
const MOCK_ENV = { DB: {} as D1Database, MT5_WEBHOOK_SECRET: VALID_SECRET }

function makeReq(path: string, body: unknown, secret?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret !== undefined) headers['X-MT5-Secret'] = secret
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

beforeEach(() => vi.clearAllMocks())

// ── Authentication ────────────────────────────────────────────

describe('X-MT5-Secret auth guard', () => {
  it('returns 401 when header is missing', async () => {
    const res = await mt5Router.request('/trade-open', makeReq('/trade-open', {}, undefined), MOCK_ENV)
    expect(res.status).toBe(401)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('UNAUTHORIZED')
  })

  it('returns 401 when secret is wrong', async () => {
    const res = await mt5Router.request('/trade-open', makeReq('/trade-open', {}, 'wrong-secret'), MOCK_ENV)
    expect(res.status).toBe(401)
  })
})

// ── POST /trade-open ──────────────────────────────────────────

describe('POST /trade-open', () => {
  it('inserts trade and returns 201 with id', async () => {
    mockRun.mockResolvedValue(undefined)

    const payload = {
      ticket: 100001,
      symbol: 'EURUSD',
      direction: 'BUY',
      openPrice: 1.08500,
      volume: 0.10,
      openTime: '2026-06-28T10:00:00Z',
    }

    const res = await mt5Router.request('/trade-open', makeReq('/trade-open', payload, VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(201)

    const body = await res.json() as { success: boolean; id: string }
    expect(body.success).toBe(true)
    expect(body.id).toBe('100001')
    expect(mockRun).toHaveBeenCalledOnce()
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await mt5Router.request('/trade-open', makeReq('/trade-open', { ticket: 1 }, VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(400)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INVALID_PARAMS')
  })
})

// ── POST /trade-close ─────────────────────────────────────────

describe('POST /trade-close', () => {
  it('updates trade and returns 200', async () => {
    mockFirst.mockResolvedValue({ id: '100001', symbol: 'EURUSD', direction: 'BUY', open_price: 1.085 })
    mockRun.mockResolvedValue(undefined)

    const payload = {
      ticket: 100001,
      closePrice: 1.09200,
      closeTime: '2026-06-28T12:00:00Z',
      profit: 70.00,
    }

    const res = await mt5Router.request('/trade-close', makeReq('/trade-close', payload, VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(200)

    const body = await res.json() as { success: boolean }
    expect(body.success).toBe(true)
    expect(mockRun).toHaveBeenCalledOnce()
  })

  it('returns 404 when ticket does not exist', async () => {
    mockFirst.mockResolvedValue(null)

    const payload = {
      ticket: 999999,
      closePrice: 1.0,
      closeTime: '2026-06-28T12:00:00Z',
      profit: -5.0,
    }

    const res = await mt5Router.request('/trade-close', makeReq('/trade-close', payload, VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(404)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('NOT_FOUND')
  })
})

// ── POST /heartbeat ───────────────────────────────────────────

describe('POST /heartbeat', () => {
  it('upserts bot_status and returns 200', async () => {
    mockRun.mockResolvedValue(undefined)

    const payload = { status: 'RUNNING', timestamp: '2026-06-28T10:30:00Z' }

    const res = await mt5Router.request('/heartbeat', makeReq('/heartbeat', payload, VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(200)

    const body = await res.json() as { success: boolean }
    expect(body.success).toBe(true)
    expect(mockRun).toHaveBeenCalledOnce()

    // Verify the SQL upsert was called with correct values
    const [sql, params] = mockRun.mock.calls[0] as [string, unknown[]]
    expect(sql).toContain('bot_status')
    expect(sql).toContain('ON CONFLICT')
    expect(params).toContain('RUNNING')
    expect(params).toContain('2026-06-28T10:30:00Z')
  })

  it('returns 400 for invalid status value', async () => {
    const payload = { status: 'UNKNOWN', timestamp: '2026-06-28T10:30:00Z' }
    const res = await mt5Router.request('/heartbeat', makeReq('/heartbeat', payload, VALID_SECRET), MOCK_ENV)
    expect(res.status).toBe(400)
  })
})
