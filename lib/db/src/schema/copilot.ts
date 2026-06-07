import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const copilotMessagesTable = pgTable("copilot_messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  context: text("context"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export type CopilotMessage = typeof copilotMessagesTable.$inferSelect;
