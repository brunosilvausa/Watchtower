import { sql } from 'drizzle-orm';
import { check, index, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Identity key only: Better Auth's generated identity/session schema is reviewed in M2.
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [check('workspace_name_nonempty', sql`length(trim(${table.name})) between 1 and 100`)]);
export const memberships = pgTable('memberships', {
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'restrict' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  role: text('role').notNull().default('owner'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.workspaceId, table.userId] }),
  index('memberships_user_idx').on(table.userId),
  check('membership_role', sql`${table.role} in ('owner','admin','editor','viewer')`),
]);
