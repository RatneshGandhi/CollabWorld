import { pgTable, serial, text, timestamp, uuid, varchar, jsonb, boolean, integer, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Documents Table
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: varchar('title', { length: 255 }).notNull().default('Untitled Document'),
    ownerId: integer('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    data: jsonb('data').default({ ops: [{ insert: '\n' }] }).notNull(),
    isArchived: boolean('is_archived').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Composite index for rapid dashboard listing queries
    index('owner_active_idx').on(table.ownerId, table.isArchived, table.updatedAt),
  ]
);