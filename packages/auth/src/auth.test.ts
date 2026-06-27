import { describe, it, expect } from 'vitest'
import { generateToken, verifyToken } from './auth'
import { SignJWT } from 'jose'

const TEST_SECRET = 'test-secret-key-that-is-long-enough-for-hs256'

describe('generateToken', () => {
  it('returns a non-empty JWT string', async () => {
    const token = await generateToken('user-123', 'user', TEST_SECRET)
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
    // JWT has 3 dot-separated parts
    expect(token.split('.').length).toBe(3)
  })

  it('encodes userId and role in the payload', async () => {
    const token = await generateToken('user-456', 'owner', TEST_SECRET)
    const payload = await verifyToken(token, TEST_SECRET)
    expect(payload).not.toBeNull()
    expect(payload?.userId).toBe('user-456')
    expect(payload?.role).toBe('owner')
  })
})

describe('verifyToken', () => {
  it('returns payload for a valid token', async () => {
    const token = await generateToken('user-789', 'user', TEST_SECRET)
    const result = await verifyToken(token, TEST_SECRET)
    expect(result).toEqual({ userId: 'user-789', role: 'user' })
  })

  it('returns null for an invalid token string', async () => {
    const result = await verifyToken('not.a.valid.token', TEST_SECRET)
    expect(result).toBeNull()
  })

  it('returns null when the secret is wrong', async () => {
    const token = await generateToken('user-abc', 'user', TEST_SECRET)
    const result = await verifyToken(token, 'wrong-secret-value')
    expect(result).toBeNull()
  })

  it('returns null for an expired token', async () => {
    // Build a token that expired 1 second ago
    const key = new TextEncoder().encode(TEST_SECRET)
    const now = Math.floor(Date.now() / 1000)
    const expiredToken = await new SignJWT({ userId: 'user-exp', role: 'user' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now - 10)
      .setExpirationTime(now - 1)
      .sign(key)

    const result = await verifyToken(expiredToken, TEST_SECRET)
    expect(result).toBeNull()
  })

  it('returns null for an empty string', async () => {
    const result = await verifyToken('', TEST_SECRET)
    expect(result).toBeNull()
  })
})
