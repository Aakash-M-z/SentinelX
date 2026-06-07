import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("open"),
  description: text("description").notNull(),
  affectedAssets: jsonb("affected_assets").$type<string[]>().notNull().default([]),
  assignee: text("assignee"),
  rootCause: text("root_cause"),
  mitigations: jsonb("mitigations").$type<string[]>().notNull().default([]),
  evidenceCount: integer("evidence_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const timelineEventsTable = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  incidentId: integer("incident_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  actor: text("actor").notNull(),
  evidence: text("evidence"),
  assetId: integer("asset_id"),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type Incident = typeof incidentsTable.$inferSelect;
export type TimelineEvent = typeof timelineEventsTable.$inferSelect;
