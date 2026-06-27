import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPaymentIntentCreate = vi.fn()
const mockCheckoutSessionCreate = vi.fn()

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      paymentIntents: { create: mockPaymentIntentCreate },
      checkout: { sessions: { create: mockCheckoutSessionCreate } },
    }
  }),
}))

import { createPaymentIntent, createCheckoutSession } from './payment.handler'

beforeEach(() => {
  vi.clearAllMocks()
  mockPaymentIntentCreate.mockResolvedValue({ id: 'pi_test', client_secret: 'secret_test', amount: 1000, currency: 'thb' })
  mockCheckoutSessionCreate.mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.com/test' })
})

describe('createPaymentIntent', () => {
  it('returns a payment intent with client_secret', async () => {
    const result = await createPaymentIntent('sk_test', 1000, 'thb', 'Test')
    expect(result.client_secret).toBe('secret_test')
    expect(result.amount).toBe(1000)
  })
})

describe('createCheckoutSession', () => {
  it('returns a checkout session with url', async () => {
    const result = await createCheckoutSession('sk_test', 'price_test', 'https://example.com/success', 'https://example.com/cancel')
    expect(result.url).toContain('stripe.com')
    expect(result.id).toBe('cs_test')
  })
})
