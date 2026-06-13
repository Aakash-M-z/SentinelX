import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incidentsTable = sqliteTable("incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("open"),
  description: text("description").notNull(),
  affectedAssets: text("affected_assets", { mode: "json" }).$type<string[]>().notNull().default([]),
  assignee: text("assignee"),
  rootCause: text("root_cause"),
  mitigations: text("mitigations", { mode: "json" }).$type<string[]>().notNull().default([]),
  evidenceCount: integer("evidence_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
});

export const timelineEventsTable = sqliteTable("timeline_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentId: integer("incident_id").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  type: text("type").notNull(),
  description: text("description").notNull(),
  actor: text("actor").notNull(),
  evidence: text("evidence"),
  assetId: integer("asset_id"),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type Incident = typeof incidentsTable.$inferSelect;
export type TimelineEvent = typeof timelineEventsTable.$inferSelect;
