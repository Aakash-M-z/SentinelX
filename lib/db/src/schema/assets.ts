import { pgTable, serial, text, integer, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const networkAssetsTable = pgTable("network_assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  zone: text("zone").notNull(),
  department: text("department"),
  ipAddress: text("ip_address").notNull(),
  os: text("os").notNull(),
  services: jsonb("services").$type<string[]>().notNull().default([]),
  vulnerabilities: jsonb("vulnerabilities").$type<string[]>().notNull().default([]),
  compromiseLevel: integer("compromise_level").notNull().default(0),
  status: text("status").notNull().default("healthy"),
  x: real("x"),
  y: real("y"),
});

export const networkConnectionsTable = pgTable("network_connections", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),
  targetId: integer("target_id").notNull(),
  protocol: text("protocol").notNull(),
  encrypted: integer("encrypted").notNull().default(1),
  bandwidth: text("bandwidth"),
});

export const insertNetworkAssetSchema = createInsertSchema(networkAssetsTable);
export type NetworkAsset = typeof networkAssetsTable.$inferSelect;
export type NetworkConnection = typeof networkConnectionsTable.$inferSelect;
