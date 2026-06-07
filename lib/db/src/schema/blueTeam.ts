import { pgTable, serial, text, integer, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const securityAlertsTable = pgTable("security_alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull().default("open"),
  source: text("source").notNull(),
  description: text("description").notNull(),
  affectedAsset: text("affected_asset"),
  mitreId: text("mitre_id"),
  confidence: real("confidence").notNull().default(0.8),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
});

export const firewallRulesTable = pgTable("firewall_rules", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  protocol: text("protocol").notNull(),
  source: text("source").notNull(),
  destination: text("destination").notNull(),
  port: text("port"),
  reason: text("reason").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const threatDetectionsTable = pgTable("threat_detections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  technique: text("technique").notNull(),
  mitreId: text("mitre_id").notNull(),
  confidence: real("confidence").notNull(),
  status: text("status").notNull().default("detected"),
  affectedAssets: jsonb("affected_assets").$type<string[]>().notNull().default([]),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
});

export type SecurityAlert = typeof securityAlertsTable.$inferSelect;
export type FirewallRule = typeof firewallRulesTable.$inferSelect;
export type ThreatDetection = typeof threatDetectionsTable.$inferSelect;
