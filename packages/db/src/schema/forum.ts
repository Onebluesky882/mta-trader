import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { user } from './auth'

export const FORUM_CATEGORIES = ['general', 'problem', 'feature', 'howto'] as const
export type ForumCategory = typeof FORUM_CATEGORIES[number]

export const forumPosts = sqliteTable('forum_posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  postNumber: integer('post_number').notNull(),
  category: text('category', { enum: FORUM_CATEGORIES }).notNull().default('general'),
  status: text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  imageUrl: text('image_url'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const forumReplies = sqliteTable('forum_replies', {
  id: text('id').primaryKey(),
  body: text('body').notNull(),
  postId: text('post_id').notNull().references(() => forumPosts.id, { onDelete: 'cascade' }),
  parentReplyId: text('parent_reply_id'),
  imageUrl: text('image_url'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export const forumPostsRelations = relations(forumPosts, ({ one, many }) => ({
  user: one(user, { fields: [forumPosts.userId], references: [user.id] }),
  forumReplies: many(forumReplies),
}))

export const forumRepliesRelations = relations(forumReplies, ({ one }) => ({
  post: one(forumPosts, { fields: [forumReplies.postId], references: [forumPosts.id] }),
  user: one(user, { fields: [forumReplies.userId], references: [user.id] }),
}))
