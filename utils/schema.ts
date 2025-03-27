import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const AiOutput = pgTable('ai_output', {
  id: serial('id').primaryKey(),
  formData: text('form_data').notNull(),
  templateSlug: text('template_slug').notNull(),
  aiResponse: text('ai_response').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}); 