import { Hono } from 'hono'
import { sendNotificationSchema, sendWelcomeSchema } from './email.schema'
import { sendWelcomeEmail, sendNotificationEmail } from './email.handler'

type Bindings = { DB: D1Database; RESEND_API_KEY: string }

const emailRouter = new Hono<{ Bindings: Bindings }>()

emailRouter.post('/welcome', async (c) => {
  const body = await c.req.json()
  const parsed = sendWelcomeSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)
  await sendWelcomeEmail({ ...parsed.data, resendApiKey: c.env.RESEND_API_KEY })
  return c.json({ success: true })
})

emailRouter.post('/notify', async (c) => {
  const body = await c.req.json()
  const parsed = sendNotificationSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400)
  const { to, subject, message } = parsed.data
  await sendNotificationEmail({ to, name: to, subject, message, resendApiKey: c.env.RESEND_API_KEY })
  return c.json({ success: true })
})

export { emailRouter }
