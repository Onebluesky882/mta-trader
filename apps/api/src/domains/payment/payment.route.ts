import { Hono } from 'hono'
import Stripe from 'stripe'
import { createPaymentIntentSchema, createCheckoutSessionSchema } from './payment.schema'
import { createPaymentIntent, createCheckoutSession, handleWebhook } from './payment.handler'
import { createDb, purchases, eq } from '@gover-agent/db'
import { createAuth } from '@gover-agent/auth'

const PRICE_PLAN_MAP: Record<string, { plan: 'starter' | 'pro' | 'business'; invites: number }> = {
  price_1TkM0Y43gXSTS96LQiaMPGXF: { plan: 'starter', invites: 1 },
  price_1TlQtB43gXSTS96LLVdbYSFW: { plan: 'pro', invites: 3 },
  price_1TlQu643gXSTS96LUTW80l6Y: { plan: 'business', invites: 10 },
}

type Bindings = {
  DB: D1Database
  RESEND_API_KEY: string
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
  STRIPE_SECRET_KEY: string
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_WEBHOOK_SECRET: string
  GITHUB_TOKEN: string
  GITHUB_REPO_OWNER: string
  GITHUB_TEMPLATE_REPO: string
}

const paymentRouter = new Hono<{ Bindings: Bindings }>()

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'https://fullstack-builder-web.onebluesky882.workers.dev',
]

// Check if current user has purchased — returns purchase status
paymentRouter.get('/my-purchase', async (c) => {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ purchased: false })

  const [purchase] = await db
    .select()
    .from(purchases)
    .where(eq(purchases.email, session.user.email))
    .limit(1)

  if (!purchase) return c.json({ purchased: false })
  return c.json({ purchased: true, status: purchase.status, githubUsername: purchase.githubUsername })
})

// Get publishable key (safe to expose to frontend)
paymentRouter.get('/config', (c) => {
  return c.json({ publishableKey: c.env.STRIPE_PUBLISHABLE_KEY })
})

// Create a payment intent (for custom checkout UI)
paymentRouter.post('/intent', async (c) => {
  const body = await c.req.json()
  const parsed = createPaymentIntentSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)
  const { amount, currency, description } = parsed.data
  const intent = await createPaymentIntent(c.env.STRIPE_SECRET_KEY, amount, currency, description)
  return c.json({ clientSecret: intent.client_secret })
})

// Create a hosted checkout session (Stripe-hosted payment page)
paymentRouter.post('/checkout', async (c) => {
  const body = await c.req.json()
  const parsed = createCheckoutSessionSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)
  const { priceId, successUrl, cancelUrl, customerEmail } = parsed.data
  const session = await createCheckoutSession(
    c.env.STRIPE_SECRET_KEY,
    priceId,
    successUrl,
    cancelUrl,
    customerEmail,
  )
  return c.json({ url: session.url })
})

// Stripe webhook — receives payment events
paymentRouter.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature')
  if (!signature) return c.json({ error: 'Missing signature' }, 400)
  const body = await c.req.text()

  let event: Awaited<ReturnType<typeof handleWebhook>>
  try {
    event = await handleWebhook(
      c.env.STRIPE_SECRET_KEY,
      c.env.STRIPE_WEBHOOK_SECRET,
      body,
      signature,
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return c.json({ error: 'Webhook verification failed', detail: msg }, 400)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string
      customer_email?: string | null
      customer_details?: { email?: string | null }
    }
    const email = session.customer_email ?? session.customer_details?.email ?? ''
    if (email) {
      const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2026-06-24.dahlia' })
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items'],
      })
      const priceId = fullSession.line_items?.data[0]?.price?.id ?? ''
      const planInfo = PRICE_PLAN_MAP[priceId] ?? { plan: 'starter' as const, invites: 1 }

      const db = createDb(c.env.DB)
      await db.insert(purchases).values({
        id: crypto.randomUUID(),
        email,
        stripeSessionId: session.id,
        status: 'pending',
        plan: planInfo.plan,
        invitesRemaining: planInfo.invites,
        createdAt: new Date(),
      }).onConflictDoNothing()
    }
  }

  return c.json({ received: true })
})

// Buyer submits GitHub username after payment — sends invite
paymentRouter.post('/github-invite', async (c) => {
  const body = await c.req.json<{ sessionId: string; githubUsername: string }>()
  const { sessionId, githubUsername } = body
  if (!sessionId || !githubUsername) return c.json({ error: 'Missing fields' }, 400)

  const db = createDb(c.env.DB)
  const [purchase] = await db
    .select()
    .from(purchases)
    .where(eq(purchases.stripeSessionId, sessionId))
    .limit(1)

  if (!purchase) return c.json({ error: 'Purchase not found' }, 404)
  if (purchase.invitesRemaining <= 0) return c.json({ error: 'No invites remaining for this purchase' }, 403)

  // Call GitHub API to invite collaborator (read-only pull access)
  const res = await fetch(
    `https://api.github.com/repos/${c.env.GITHUB_REPO_OWNER}/${c.env.GITHUB_TEMPLATE_REPO}/collaborators/${githubUsername}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'GoverAgent',
      },
      body: JSON.stringify({ permission: 'pull' }),
    },
  )

  if (!res.ok && res.status !== 201 && res.status !== 204) {
    const ghError = await res.json().catch(() => ({}))
    await db
      .update(purchases)
      .set({ status: 'failed', githubUsername })
      .where(eq(purchases.stripeSessionId, sessionId))
    return c.json({ error: 'GitHub invite failed', status: res.status, detail: ghError }, 500)
  }

  const newRemaining = purchase.invitesRemaining - 1
  await db
    .update(purchases)
    .set({
      status: newRemaining === 0 ? 'invited' : 'pending',
      githubUsername,
      invitedAt: new Date(),
      invitesRemaining: newRemaining,
    })
    .where(eq(purchases.stripeSessionId, sessionId))

  return c.json({
    success: true,
    message: `Invited ${githubUsername} to the template repo`,
    invitesRemaining: newRemaining,
  })
})

export { paymentRouter }
