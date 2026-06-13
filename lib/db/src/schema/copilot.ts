import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const copilotMessagesTable = sqliteTable("copilot_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  context: text("context"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type CopilotMessage = typeof copilotMessagesTable.$inferSelect;
