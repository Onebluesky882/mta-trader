import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mock auth ---
const mockSignInEmail = vi.fn()
vi.mock('@gover-agent/auth', () => ({
  createAuth: vi.fn(() => ({
    api: { signInEmail: mockSignInEmail },
  })),
}))

vi.mock('@gover-agent/db', () => ({
  createDb: vi.fn(() => ({})),
}))

import { mtaAuthRouter } from './auth'

const MOCK_ENV = { DB: {} as D1Database }

beforeEach(() => vi.clearAllMocks())

describe('POST /api/auth/login', () => {
  it('returns 200 with token when credentials are valid', async () => {
    mockSignInEmail.mockResolvedValue({ token: 'test-bearer-token' })

    const req = new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'secret' }),
    })
    const res = await mtaAuthRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(200)
    const body = await res.json() as { token: string; expiresAt: string }
    expect(body.token).toBe('test-bearer-token')
    expect(typeof body.expiresAt).toBe('string')
  })

  it('returns 401 when credentials are invalid', async () => {
    mockSignInEmail.mockRejectedValue(new Error('Invalid credentials'))

    const req = new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'wrong' }),
    })
    const res = await mtaAuthRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(401)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INVALID_CREDENTIALS')
  })

  it('returns 400 when email is missing', async () => {
    const req = new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'secret' }),
    })
    const res = await mtaAuthRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(400)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INVALID_PARAMS')
  })

  it('returns 400 when password is missing', async () => {
    const req = new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    })
    const res = await mtaAuthRouter.fetch(req, MOCK_ENV)

    expect(res.status).toBe(400)
    const body = await res.json() as { code: string }
    expect(body.code).toBe('INVALID_PARAMS')
  })
})
