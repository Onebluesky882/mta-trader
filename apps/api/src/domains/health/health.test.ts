import { describe, it, expect } from 'vitest'
import { health } from './health.route'

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const req = new Request('http://localhost/')
    const res = await health.fetch(req)
    expect(res.status).toBe(200)
    const body = await res.json() as { status: string; timestamp: string }
    expect(body.status).toBe('ok')
    expect(typeof body.timestamp).toBe('string')
  })
})
