import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const executiveReportsTable = pgTable("executive_reports", {
  id: serial("id").primaryKey(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  executiveSummary: text("executive_summary").notNull(),
  technicalSummary: text("technical_summary").notNull(),
  riskLevel: text("risk_level").notNull().default("medium"),
  financialImpact: text("financial_impact").notNull(),
  mitigations: jsonb("mitigations").$type<string[]>().notNull().default([]),
  complianceNist: text("compliance_nist").notNull().default("Partial"),
  complianceIso27001: text("compliance_iso27001").notNull().default("Partial"),
  complianceSoc2: text("compliance_soc2").notNull().default("Partial"),
  attackChainSummary: text("attack_chain_summary"),
});

export type ExecutiveReport = typeof executiveReportsTable.$inferSelect;
