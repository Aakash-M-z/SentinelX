import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  simulationsTable,
  simulationEventsTable,
  agentStatesTable,
  networkAssetsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

async function getOrCreateSimulation() {
  const [existing] = await db.select().from(simulationsTable).orderBy(desc(simulationsTable.id)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(simulationsTable).values({ state: "idle", phase: "reconnaissance" }).returning();
  return created;
}

router.get("/simulation/status", async (req, res): Promise<void> => {
  const sim = await getOrCreateSimulation();
  const durationSeconds = sim.startedAt
    ? Math.floor((Date.now() - new Date(sim.startedAt).getTime()) / 1000)
    : null;
  res.json({ ...sim, durationSeconds });
});

router.post("/simulation/start", async (req, res): Promise<void> => {
  const { scenario = "apt_attack", difficulty = "medium", autoAdvance = true } = req.body ?? {};
  const sim = await getOrCreateSimulation();
  const [updated] = await db
    .update(simulationsTable)
    .set({ state: "running", phase: "reconnaissance", scenario, difficulty, autoAdvance, startedAt: new Date(), completedAt: null, redTeamScore: 0, blueTeamScore: 0, overallRisk: "medium" })
    .where(eq(simulationsTable.id, sim.id))
    .returning();

  await db.insert(simulationEventsTable).values({
    simulationId: updated.id,
    type: "attack",
    actor: "system",
    description: `Simulation started — Scenario: ${scenario} | Difficulty: ${difficulty}`,
    severity: "info",
  });

  await db.update(agentStatesTable).set({ state: "thinking", currentObjective: "Begin reconnaissance of target network", actionsCompleted: 0, reasoning: "" }).where(eq(agentStatesTable.agent, "red_team"));
  await db.update(agentStatesTable).set({ state: "thinking", currentObjective: "Monitor network for anomalies", actionsCompleted: 0, reasoning: "" }).where(eq(agentStatesTable.agent, "blue_team"));

  res.json({ ...updated, durationSeconds: 0 });
});

router.post("/simulation/stop", async (req, res): Promise<void> => {
  const sim = await getOrCreateSimulation();
  const [updated] = await db
    .update(simulationsTable)
    .set({ state: "paused" })
    .where(eq(simulationsTable.id, sim.id))
    .returning();
  await db.insert(simulationEventsTable).values({ simulationId: sim.id, type: "response", actor: "system", description: "Simulation paused by operator", severity: "info" });
  res.json({ ...updated, durationSeconds: null });
});

router.post("/simulation/reset", async (req, res): Promise<void> => {
  const sim = await getOrCreateSimulation();
  const [updated] = await db
    .update(simulationsTable)
    .set({ state: "idle", phase: "reconnaissance", redTeamScore: 0, blueTeamScore: 0, overallRisk: null, startedAt: null, completedAt: null })
    .where(eq(simulationsTable.id, sim.id))
    .returning();

  await db.update(networkAssetsTable).set({ compromiseLevel: 0, status: "healthy" });
  await db.update(agentStatesTable).set({ state: "idle", currentObjective: "Awaiting orders", actionsCompleted: 0, reasoning: "", memoryContext: null });

  res.json({ ...updated, durationSeconds: null });
});

router.get("/simulation/events", async (req, res): Promise<void> => {
  const limit = Number(req.query.limit ?? 50);
  const type = req.query.type as string | undefined;
  let query = db.select().from(simulationEventsTable).orderBy(desc(simulationEventsTable.timestamp)).limit(limit);
  const events = await query;
  const filtered = type ? events.filter((e) => e.type === type) : events;
  res.json(filtered.map((e) => ({
    ...e,
    assetId: e.assetId ?? null,
    assetName: e.assetName ?? null,
    technique: e.technique ?? null,
    mitreId: e.mitreId ?? null,
    timestamp: e.timestamp.toISOString(),
  })));
});

router.get("/simulation/metrics", async (req, res): Promise<void> => {
  const events = await db.select().from(simulationEventsTable).orderBy(desc(simulationEventsTable.timestamp)).limit(500);
  const attacksLaunched = events.filter((e) => e.type === "attack" && e.actor === "red_team").length;
  const attacksDetected = events.filter((e) => e.type === "detection").length;
  const attacksBlocked = events.filter((e) => e.type === "containment").length;
  const assets = await db.select().from(networkAssetsTable);
  const assetsCompromised = assets.filter((a) => a.status === "compromised").length;
  res.json({
    totalEvents: events.length,
    attacksLaunched,
    attacksDetected,
    attacksBlocked,
    assetsCompromised,
    meanTimeToDetect: attacksDetected > 0 ? 4.2 : 0,
    meanTimeToRespond: attacksBlocked > 0 ? 8.7 : 0,
    riskReduction: attacksBlocked > 0 ? Math.min(100, (attacksBlocked / Math.max(1, attacksLaunched)) * 100) : 0,
    phaseBreakdown: [
      { phase: "Reconnaissance", count: events.filter((e) => e.technique?.includes("recon") || e.description?.toLowerCase().includes("recon")).length, blocked: 0 },
      { phase: "Exploitation", count: events.filter((e) => e.description?.toLowerCase().includes("exploit")).length, blocked: attacksBlocked },
      { phase: "Lateral Movement", count: events.filter((e) => e.description?.toLowerCase().includes("lateral")).length, blocked: 0 },
    ],
  });
});

export default router;
