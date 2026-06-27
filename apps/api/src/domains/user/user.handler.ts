import { createDb, eq, user as userTable } from '@gover-agent/db'
import type { Context } from 'hono'
import type { Auth } from '@gover-agent/auth'

export async function getMe(c: Context, auth: Auth) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Unauthorized' }, 401)

  const ownerEmail = (c.env as Record<string, string>).OWNER_EMAIL
  const db = createDb((c.env as Record<string, unknown>).DB as D1Database)

  // Auto-promote to owner if OWNER_EMAIL matches and role is not already owner
  if (ownerEmail && session.user.email === ownerEmail && (session.user as any).role !== 'owner') {
    await db.update(userTable).set({ role: 'owner' }).where(eq(userTable.id, session.user.id))
  }

  // Always return fresh role from DB
  const dbUser = await db.select().from(userTable).where(eq(userTable.id, session.user.id)).get()

  return c.json({ user: { ...session.user, role: dbUser?.role ?? 'member' } })
}
