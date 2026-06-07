import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const attackActionsTable = pgTable("attack_actions", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id"),
  phase: text("phase").notNull(),
  technique: text("technique").notNull(),
  mitreId: text("mitre_id"),
  target: text("target").notNull(),
  status: text("status").notNull().default("pending"),
  impact: text("impact"),
  reasoning: text("reasoning"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const findingsTable = pgTable("findings", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  asset: text("asset").notNull(),
  cveId: text("cve_id"),
  description: text("description").notNull(),
  exploitable: boolean("exploitable").notNull().default(false),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const attackGraphNodesTable = pgTable("attack_graph_nodes", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull().unique(),
  label: text("label").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("intact"),
  assetId: integer("asset_id"),
  riskScore: integer("risk_score"),
});

export const attackGraphEdgesTable = pgTable("attack_graph_edges", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  target: text("target").notNull(),
  technique: text("technique").notNull(),
  status: text("status").notNull().default("attempted"),
});

export type AttackAction = typeof attackActionsTable.$inferSelect;
export type Finding = typeof findingsTable.$inferSelect;
