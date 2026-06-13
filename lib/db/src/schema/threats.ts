import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const threatIntelTable = sqliteTable("threat_intel", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cveId: text("cve_id").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  cvssScore: real("cvss_score").notNull(),
  description: text("description").notNull(),
  affectedSystems: text("affected_systems", { mode: "json" }).$type<string[]>().notNull().default([]),
  mitreId: text("mitre_id"),
  exploitability: text("exploitability").notNull().default("unproven"),
  patchAvailable: integer("patch_available", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const threatActorsTable = sqliteTable("threat_actors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  aliases: text("aliases", { mode: "json" }).$type<string[]>().notNull().default([]),
  motivation: text("motivation").notNull(),
  sophistication: text("sophistication").notNull(),
  targetedSectors: text("targeted_sectors", { mode: "json" }).$type<string[]>().notNull().default([]),
  tactics: text("tactics", { mode: "json" }).$type<string[]>().notNull().default([]),
  description: text("description").notNull(),
  activeStatus: integer("active_status", { mode: "boolean" }).notNull().default(true),
});

export const iocsTable = sqliteTable("iocs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  value: text("value").notNull(),
  severity: text("severity").notNull(),
  confidence: real("confidence").notNull(),
  description: text("description").notNull(),
  associatedActor: text("associated_actor"),
  firstSeen: integer("first_seen", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastSeen: integer("last_seen", { mode: "timestamp" }),
});

export type ThreatIntel = typeof threatIntelTable.$inferSelect;
export type ThreatActor = typeof threatActorsTable.$inferSelect;
export type Ioc = typeof iocsTable.$inferSelect;
