import { Hono } from 'hono'
import { createDb, roadmapPhases, roadmapTasks, user, eq, asc } from '@gover-agent/db'
import { createAuth } from '@gover-agent/auth'

type Bindings = { DB: D1Database }

const roadmapRouter = new Hono<{ Bindings: Bindings }>()

const TRUSTED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
]

async function getSession(c: { env: Bindings; req: { raw: Request } }) {
  const db = createDb(c.env.DB)
  const auth = createAuth(db, TRUSTED_ORIGINS)
  return auth.api.getSession({ headers: c.req.raw.headers })
}

async function getRole(db: ReturnType<typeof createDb>, userId: string) {
  const u = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { role: true, email: true },
  })
  return u
}

// GET /api/roadmap — owner and client can view
roadmapRouter.get('/', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const db = createDb(c.env.DB)
  const u = await getRole(db, session.user.id)
  if (!u || (u.role !== 'owner' && u.role !== 'client')) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const phases = await db.query.roadmapPhases.findMany({
    orderBy: [asc(roadmapPhases.order)],
    with: {
      roadmapTasks: { orderBy: [asc(roadmapTasks.order)] },
    },
  })
  return c.json(phases)
})

// POST /api/roadmap/phases — owner only
roadmapRouter.post('/phases', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const db = createDb(c.env.DB)
  const u = await getRole(db, session.user.id)
  if (!u || u.role !== 'owner') return c.json({ error: 'Forbidden — owner only' }, 403)

  const { phase, description, status, order } = await c.req.json<{
    phase: string; description?: string; status?: 'done' | 'in-progress' | 'planned'; order?: number
  }>()
  if (!phase?.trim()) return c.json({ error: 'Missing phase name' }, 400)

  const now = new Date()
  const newPhase = {
    id: crypto.randomUUID(),
    phase: phase.trim(),
    description: description?.trim() ?? '',
    status: (status ?? 'planned') as 'done' | 'in-progress' | 'planned',
    order: order ?? 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.insert(roadmapPhases).values(newPhase)
  return c.json({ success: true, phase: newPhase })
})

// PATCH /api/roadmap/phases/:id — owner only
roadmapRouter.patch('/phases/:id', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const db = createDb(c.env.DB)
  const u = await getRole(db, session.user.id)
  if (!u || u.role !== 'owner') return c.json({ error: 'Forbidden — owner only' }, 403)

  const id = c.req.param('id')
  const existing = await db.query.roadmapPhases.findFirst({ where: eq(roadmapPhases.id, id) })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const body = await c.req.json<Partial<{ phase: string; description: string; status: 'done' | 'in-progress' | 'planned'; order: number }>>()
  await db.update(roadmapPhases).set({ ...body, updatedAt: new Date() }).where(eq(roadmapPhases.id, id))
  return c.json({ success: true })
})

// POST /api/roadmap/phases/:id/tasks — owner only
roadmapRouter.post('/phases/:id/tasks', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const db = createDb(c.env.DB)
  const u = await getRole(db, session.user.id)
  if (!u || u.role !== 'owner') return c.json({ error: 'Forbidden — owner only' }, 403)

  const phaseId = c.req.param('id')
  const { label, status, order } = await c.req.json<{ label: string; status?: 'done' | 'in-progress' | 'planned'; order?: number }>()
  if (!label?.trim()) return c.json({ error: 'Missing label' }, 400)

  const now = new Date()
  const task = {
    id: crypto.randomUUID(),
    phaseId,
    label: label.trim(),
    status: (status ?? 'planned') as 'done' | 'in-progress' | 'planned',
    order: order ?? 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.insert(roadmapTasks).values(task)
  return c.json({ success: true, task })
})

// PATCH /api/roadmap/tasks/:id — owner only
roadmapRouter.patch('/tasks/:id', async (c) => {
  const session = await getSession(c)
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const db = createDb(c.env.DB)
  const u = await getRole(db, session.user.id)
  if (!u || u.role !== 'owner') return c.json({ error: 'Forbidden — owner only' }, 403)

  const id = c.req.param('id')
  const existing = await db.query.roadmapTasks.findFirst({ where: eq(roadmapTasks.id, id) })
  if (!existing) return c.json({ error: 'Not found' }, 404)

  const body = await c.req.json<Partial<{ label: string; status: 'done' | 'in-progress' | 'planned'; order: number }>>()
  await db.update(roadmapTasks).set({ ...body, updatedAt: new Date() }).where(eq(roadmapTasks.id, id))
  return c.json({ success: true })
})

export { roadmapRouter }
