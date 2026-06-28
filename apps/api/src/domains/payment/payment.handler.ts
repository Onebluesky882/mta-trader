import Stripe from 'stripe'

function createStripe(secretKey: string) {
  return new Stripe(secretKey, { apiVersion: '2026-06-24.dahlia' })
}

export async function createPaymentIntent(
  secretKey: string,
  amount: number,
  currency: string,
  description?: string,
) {
  const stripe = createStripe(secretKey)
  return stripe.paymentIntents.create({ amount, currency, description })
}

export async function createCheckoutSession(
  secretKey: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  customerEmail?: string,
) {
  const stripe = createStripe(secretKey)
  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
  })
}

export async function handleWebhook(
  secretKey: string,
  webhookSecret: string,
  body: string,
  signature: string,
) {
  const stripe = createStripe(secretKey)
  return stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
}
