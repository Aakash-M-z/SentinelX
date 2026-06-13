import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const attackActionsTable = sqliteTable("attack_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  simulationId: integer("simulation_id"),
  phase: text("phase").notNull(),
  technique: text("technique").notNull(),
  mitreId: text("mitre_id"),
  target: text("target").notNull(),
  status: text("status").notNull().default("pending"),
  impact: text("impact"),
  reasoning: text("reasoning"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const findingsTable = sqliteTable("findings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  simulationId: integer("simulation_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  asset: text("asset").notNull(),
  cveId: text("cve_id"),
  description: text("description").notNull(),
  exploitable: integer("exploitable", { mode: "boolean" }).notNull().default(false),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const attackGraphNodesTable = sqliteTable("attack_graph_nodes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nodeId: text("node_id").notNull().unique(),
  label: text("label").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("intact"),
  assetId: integer("asset_id"),
  riskScore: integer("risk_score"),
});

export const attackGraphEdgesTable = sqliteTable("attack_graph_edges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull(),
  target: text("target").notNull(),
  technique: text("technique").notNull(),
  status: text("status").notNull().default("attempted"),
});

export type AttackAction = typeof attackActionsTable.$inferSelect;
export type Finding = typeof findingsTable.$inferSelect;
