import { Hono } from 'hono'
import { saveSetupSchema } from './setup.schema'
import { saveSetup } from './setup.handler'

type Bindings = { DB: D1Database }

const setupRouter = new Hono<{ Bindings: Bindings }>()

// POST /api/setup — save onboarding answers (no auth required)
setupRouter.post('/', async (c) => {
  const body = await c.req.json()
  const parsed = saveSetupSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid request', issues: parsed.error.issues }, 400)

  const id = await saveSetup(c.env.DB, parsed.data)
  return c.json({ ok: true, id })
})

export { setupRouter }
