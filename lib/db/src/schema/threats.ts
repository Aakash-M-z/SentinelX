import { pgTable, serial, text, integer, timestamp, real, boolean, jsonb } from "drizzle-orm/pg-core";

export const threatIntelTable = pgTable("threat_intel", {
  id: serial("id").primaryKey(),
  cveId: text("cve_id").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  cvssScore: real("cvss_score").notNull(),
  description: text("description").notNull(),
  affectedSystems: jsonb("affected_systems").$type<string[]>().notNull().default([]),
  mitreId: text("mitre_id"),
  exploitability: text("exploitability").notNull().default("unproven"),
  patchAvailable: boolean("patch_available").notNull().default(false),
  published: timestamp("published").notNull().defaultNow(),
});

export const threatActorsTable = pgTable("threat_actors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  aliases: jsonb("aliases").$type<string[]>().notNull().default([]),
  motivation: text("motivation").notNull(),
  sophistication: text("sophistication").notNull(),
  targetedSectors: jsonb("targeted_sectors").$type<string[]>().notNull().default([]),
  tactics: jsonb("tactics").$type<string[]>().notNull().default([]),
  description: text("description").notNull(),
  activeStatus: boolean("active_status").notNull().default(true),
});

export const iocsTable = pgTable("iocs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  value: text("value").notNull(),
  severity: text("severity").notNull(),
  confidence: real("confidence").notNull(),
  description: text("description").notNull(),
  associatedActor: text("associated_actor"),
  firstSeen: timestamp("first_seen").notNull().defaultNow(),
  lastSeen: timestamp("last_seen"),
});

export type ThreatIntel = typeof threatIntelTable.$inferSelect;
export type ThreatActor = typeof threatActorsTable.$inferSelect;
export type Ioc = typeof iocsTable.$inferSelect;
