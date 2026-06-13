import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";

export const networkAssetsTable = sqliteTable("network_assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  zone: text("zone").notNull(),
  department: text("department"),
  ipAddress: text("ip_address").notNull(),
  os: text("os").notNull(),
  services: text("services", { mode: "json" }).$type<string[]>().notNull().default([]),
  vulnerabilities: text("vulnerabilities", { mode: "json" }).$type<string[]>().notNull().default([]),
  compromiseLevel: integer("compromise_level").notNull().default(0),
  status: text("status").notNull().default("healthy"),
  x: real("x"),
  y: real("y"),
});

export const networkConnectionsTable = sqliteTable("network_connections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceId: integer("source_id").notNull(),
  targetId: integer("target_id").notNull(),
  protocol: text("protocol").notNull(),
  encrypted: integer("encrypted").notNull().default(1),
  bandwidth: text("bandwidth"),
});

export const insertNetworkAssetSchema = createInsertSchema(networkAssetsTable);
export type NetworkAsset = typeof networkAssetsTable.$inferSelect;
export type NetworkConnection = typeof networkConnectionsTable.$inferSelect;
