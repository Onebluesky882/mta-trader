import { describe, it, expect, vi } from 'vitest'
import { saveSetup } from './setup.handler'

function makeDb(overrides?: Partial<D1Database>): D1Database {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
    first: vi.fn(),
    all: vi.fn(),
    raw: vi.fn(),
  }
  return {
    prepare: vi.fn().mockReturnValue(stmt),
    ...overrides,
  } as unknown as D1Database
}

describe('saveSetup', () => {
  it('inserts a row and returns a uuid string', async () => {
    const db = makeDb()
    const id = await saveSetup(db, { language: 'Thai', businessName: 'My Shop' })
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(db.prepare).toHaveBeenCalledOnce()
  })

  it('accepts all optional fields without error', async () => {
    const db = makeDb()
    await expect(
      saveSetup(db, {
        language: 'English',
        businessName: 'Acme',
        businessDescription: 'Sells things',
        targetCustomers: 'Everyone',
        websiteFeatures: ['ecommerce', 'blog'],
        needsAdminPanel: 'yes',
        onlinePayments: 'yes',
        preferredStyle: 'minimal',
        websitePages: ['home', 'about'],
        timeline: 'normal',
      }),
    ).resolves.not.toThrow()
  })
})
