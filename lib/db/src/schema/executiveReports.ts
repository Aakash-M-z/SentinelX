import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const executiveReportsTable = sqliteTable("executive_reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  generatedAt: integer("generated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  executiveSummary: text("executive_summary").notNull(),
  technicalSummary: text("technical_summary").notNull(),
  riskLevel: text("risk_level").notNull().default("medium"),
  financialImpact: text("financial_impact").notNull(),
  mitigations: text("mitigations", { mode: "json" }).$type<string[]>().notNull().default([]),
  complianceNist: text("compliance_nist").notNull().default("Partial"),
  complianceIso27001: text("compliance_iso27001").notNull().default("Partial"),
  complianceSoc2: text("compliance_soc2").notNull().default("Partial"),
  attackChainSummary: text("attack_chain_summary"),
});

export type ExecutiveReport = typeof executiveReportsTable.$inferSelect;
