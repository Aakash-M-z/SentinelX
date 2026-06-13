import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const securityAlertsTable = sqliteTable("security_alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("open"),
  source: text("source").notNull(),
  description: text("description").notNull(),
  affectedAsset: text("affected_asset"),
  mitreId: text("mitre_id"),
  confidence: real("confidence").notNull().default(0.8),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  acknowledgedAt: integer("acknowledged_at", { mode: "timestamp" }),
});

export const firewallRulesTable = sqliteTable("firewall_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  protocol: text("protocol").notNull(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  port: text("port"),
  reason: text("reason").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const threatDetectionsTable = sqliteTable("threat_detections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  technique: text("technique").notNull(),
  mitreId: text("mitre_id").notNull(),
  confidence: real("confidence").notNull(),
  status: text("status").notNull().default("detected"),
  affectedAssets: text("affected_assets", { mode: "json" }).$type<string[]>().notNull().default([]),
  detectedAt: integer("detected_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type SecurityAlert = typeof securityAlertsTable.$inferSelect;
export type FirewallRule = typeof firewallRulesTable.$inferSelect;
export type ThreatDetection = typeof threatDetectionsTable.$inferSelect;
