import { pgTable, serial, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const simulationsTable = pgTable("simulations", {
  id: serial("id").primaryKey(),
  state: text("state").notNull().default("idle"),
  phase: text("phase").notNull().default("reconnaissance"),
  scenario: text("scenario").notNull().default("apt_attack"),
  difficulty: text("difficulty").notNull().default("medium"),
  redTeamScore: integer("red_team_score").notNull().default(0),
  blueTeamScore: integer("blue_team_score").notNull().default(0),
  overallRisk: text("overall_risk"),
  autoAdvance: boolean("auto_advance").notNull().default(true),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const simulationEventsTable = pgTable("simulation_events", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id"),
  type: text("type").notNull(),
  actor: text("actor").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull().default("info"),
  assetId: integer("asset_id"),
  assetName: text("asset_name"),
  technique: text("technique"),
  mitreId: text("mitre_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const agentStatesTable = pgTable("agent_states", {
  id: serial("id").primaryKey(),
  agent: text("agent").notNull().unique(),
  state: text("state").notNull().default("idle"),
  currentObjective: text("current_objective").notNull().default("Awaiting orders"),
  actionsCompleted: integer("actions_completed").notNull().default(0),
  reasoning: text("reasoning").notNull().default(""),
  memoryContext: text("memory_context"),
  lastActionAt: timestamp("last_action_at"),
});

export const insertSimulationSchema = createInsertSchema(simulationsTable);
export const insertSimulationEventSchema = createInsertSchema(simulationEventsTable);
export type Simulation = typeof simulationsTable.$inferSelect;
export type SimulationEvent = typeof simulationEventsTable.$inferSelect;
export type AgentState = typeof agentStatesTable.$inferSelect;
