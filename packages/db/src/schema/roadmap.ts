import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export type TaskStatus = 'done' | 'in-progress' | 'planned'
export type PhaseStatus = 'done' | 'in-progress' | 'planned'

export const roadmapPhases = sqliteTable('roadmap_phases', {
  id: text('id').primaryKey(),
  phase: text('phase').notNull(),
  description: text('description').notNull().default(''),
  status: text('status', { enum: ['done', 'in-progress', 'planned'] }).notNull().default('planned'),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const roadmapTasks = sqliteTable('roadmap_tasks', {
  id: text('id').primaryKey(),
  phaseId: text('phase_id').notNull().references(() => roadmapPhases.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  status: text('status', { enum: ['done', 'in-progress', 'planned'] }).notNull().default('planned'),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})
