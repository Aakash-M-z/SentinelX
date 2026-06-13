import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const simulationsTable = sqliteTable("simulations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  state: text("state").notNull().default("idle"),
  phase: text("phase").notNull().default("reconnaissance"),
  scenario: text("scenario").notNull().default("apt_attack"),
  difficulty: text("difficulty").notNull().default("medium"),
  redTeamScore: integer("red_team_score").notNull().default(0),
  blueTeamScore: integer("blue_team_score").notNull().default(0),
  overallRisk: text("overall_risk"),
  autoAdvance: integer("auto_advance", { mode: "boolean" }).notNull().default(true),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const simulationEventsTable = sqliteTable("simulation_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  simulationId: integer("simulation_id"),
  type: text("type").notNull(),
  actor: text("actor").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull().default("info"),
  assetId: integer("asset_id"),
  assetName: text("asset_name"),
  technique: text("technique"),
  mitreId: text("mitre_id"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const agentStatesTable = sqliteTable("agent_states", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  agent: text("agent").notNull().unique(),
  state: text("state").notNull().default("idle"),
  currentObjective: text("current_objective").notNull().default("Awaiting orders"),
  actionsCompleted: integer("actions_completed").notNull().default(0),
  reasoning: text("reasoning").notNull().default(""),
  memoryContext: text("memory_context"),
  lastActionAt: integer("last_action_at", { mode: "timestamp" }),
});

export const insertSimulationSchema = createInsertSchema(simulationsTable);
export const insertSimulationEventSchema = createInsertSchema(simulationEventsTable);
export type Simulation = typeof simulationsTable.$inferSelect;
export type SimulationEvent = typeof simulationEventsTable.$inferSelect;
export type AgentState = typeof agentStatesTable.$inferSelect;
