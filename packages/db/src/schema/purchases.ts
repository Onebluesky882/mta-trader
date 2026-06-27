import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const purchases = sqliteTable('purchases', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  stripeSessionId: text('stripe_session_id').notNull().unique(),
  githubUsername: text('github_username'),
  invitedAt: integer('invited_at', { mode: 'timestamp' }),
  status: text('status', { enum: ['pending', 'invited', 'failed'] }).notNull().default('pending'),
  plan: text('plan', { enum: ['starter', 'pro', 'business'] }).notNull().default('starter'),
  invitesRemaining: integer('invites_remaining').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})


