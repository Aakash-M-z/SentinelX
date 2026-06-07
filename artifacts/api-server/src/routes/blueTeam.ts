import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  agentStatesTable,
  securityAlertsTable,
  firewallRulesTable,
  threatDetectionsTable,
  simulationsTable,
  simulationEventsTable,
  networkAssetsTable,
  attackActionsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { chatJSON } from "../lib/openai";

const router: IRouter = Router();

router.get("/blue-team/status", async (req, res): Promise<void> => {
  const [state] = await db.select().from(agentStatesTable).where(eq(agentStatesTable.agent, "blue_team"));
  if (!state) {
    res.json({ agent: "blue_team", state: "idle", currentObjective: "Monitor network for threats", actionsCompleted: 0, reasoning: "", lastActionAt: null, memoryContext: null });
    return;
  }
  res.json({ ...state, lastActionAt: state.lastActionAt?.toISOString() ?? null });
});

router.get("/blue-team/alerts", async (req, res): Promise<void> => {
  const alerts = await db.select().from(securityAlertsTable).orderBy(desc(securityAlertsTable.timestamp)).limit(50);
  res.json(alerts.map((a) => ({
    ...a, affectedAsset: a.affectedAsset ?? null, mitreId: a.mitreId ?? null, timestamp: a.timestamp.toISOString(), acknowledgedAt: a.acknowledgedAt?.toISOString() ?? null,
  })));
});

router.patch("/blue-team/alerts/:id/acknowledge", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [updated] = await db.update(securityAlertsTable).set({ status: "acknowledged", acknowledgedAt: new Date() }).where(eq(securityAlertsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Alert not found" }); return; }
  res.json({ ...updated, affectedAsset: updated.affectedAsset ?? null, mitreId: updated.mitreId ?? null, timestamp: updated.timestamp.toISOString(), acknowledgedAt: updated.acknowledgedAt?.toISOString() ?? null });
});

router.post("/blue-team/respond", async (req, res): Promise<void> => {
  const [sim] = await db.select().from(simulationsTable).orderBy(desc(simulationsTable.id)).limit(1);
  if (!sim || sim.state !== "running") { res.status(400).json({ error: "Simulation not running" }); return; }

  const [agentState] = await db.select().from(agentStatesTable).where(eq(agentStatesTable.agent, "blue_team"));
  const openAlerts = await db.select().from(securityAlertsTable).where(eq(securityAlertsTable.status, "open")).limit(5);
  const recentAttacks = await db.select().from(attackActionsTable).orderBy(desc(attackActionsTable.timestamp)).limit(3);
  const assets = await db.select().from(networkAssetsTable);

  type ResponseResult = { action: string; reasoning: string; outcome: string; technique: string; mitreId: string; nextStep: string; firewallRule?: { action: string; protocol: string; source: string; destination: string; port?: string; reason: string }; newDetection?: { name: string; technique: string; mitreId: string; confidence: number; affectedAssets: string[] }; blockedAttack?: boolean };

  const result = await chatJSON<ResponseResult>(
    `You are an autonomous AI Blue Team agent defending against a ${sim.scenario} attack.
    Current threat landscape: ${recentAttacks.map((a) => `${a.technique} on ${a.target}`).join("; ") || "no known attacks"}.
    Open alerts: ${openAlerts.map((a) => a.title).join("; ") || "none"}.
    Network status: ${assets.filter((a) => a.status !== "healthy").map((a) => `${a.name}: ${a.status} (${a.compromiseLevel}%)`).join("; ") || "all healthy"}.
    Memory: ${agentState?.memoryContext ?? "Fresh start"}.
    
    Respond with JSON: { action, reasoning, outcome (success|partial|failed|detected|blocked), technique, mitreId, nextStep, firewallRule?: { action, protocol, source, destination, port?, reason }, newDetection?: { name, technique, mitreId, confidence, affectedAssets }, blockedAttack? }
    
    Use real defensive techniques. Reference MITRE ATT&CK D3FEND or similar.`,
    "Execute the next defensive response step. Analyze threats and respond appropriately."
  );

  if (result.firewallRule) {
    await db.insert(firewallRulesTable).values({ action: result.firewallRule.action, protocol: result.firewallRule.protocol, source: result.firewallRule.source, destination: result.firewallRule.destination, port: result.firewallRule.port ?? null, reason: result.firewallRule.reason, active: 1 });
  }

  if (result.newDetection) {
    await db.insert(threatDetectionsTable).values({ name: result.newDetection.name, technique: result.newDetection.technique, mitreId: result.newDetection.mitreId, confidence: result.newDetection.confidence, status: "detected", affectedAssets: result.newDetection.affectedAssets });
    await db.insert(securityAlertsTable).values({ title: `Detected: ${result.newDetection.name}`, severity: result.newDetection.confidence > 0.8 ? "high" : "medium", source: "ids", description: `AI detected ${result.newDetection.technique} activity`, mitreId: result.newDetection.mitreId, confidence: result.newDetection.confidence });
  }

  const newActions = (agentState?.actionsCompleted ?? 0) + 1;
  await db.update(agentStatesTable).set({
    state: "executing", currentObjective: result.nextStep, actionsCompleted: newActions, reasoning: result.reasoning, memoryContext: `${agentState?.memoryContext ?? ""}\n[Defense] ${result.action} → ${result.outcome}`.slice(-2000), lastActionAt: new Date(),
  }).where(eq(agentStatesTable.agent, "blue_team"));

  await db.update(simulationsTable).set({ blueTeamScore: (sim.blueTeamScore ?? 0) + (result.outcome === "success" ? 10 : result.outcome === "partial" ? 5 : 2) }).where(eq(simulationsTable.id, sim.id));

  const [event] = await db.insert(simulationEventsTable).values({ simulationId: sim.id, type: result.newDetection ? "detection" : "response", actor: "blue_team", description: `${result.technique}: ${result.action}`, severity: result.outcome === "success" ? "medium" : "low", technique: result.technique, mitreId: result.mitreId }).returning();

  res.json({
    agent: "blue_team", action: result.action, reasoning: result.reasoning, outcome: result.outcome, nextStep: result.nextStep, technique: result.technique, mitreId: result.mitreId, affectedAssets: result.newDetection?.affectedAssets ?? [],
    generatedEvents: [{ ...event, timestamp: event.timestamp.toISOString(), assetId: event.assetId ?? null, assetName: event.assetName ?? null, technique: event.technique ?? null, mitreId: event.mitreId ?? null }],
  });
});

router.get("/blue-team/firewall-rules", async (req, res): Promise<void> => {
  const rules = await db.select().from(firewallRulesTable).orderBy(desc(firewallRulesTable.createdAt)).limit(30);
  res.json(rules.map((r) => ({ ...r, port: r.port ?? null, active: r.active === 1, createdAt: r.createdAt.toISOString() })));
});

router.get("/blue-team/detections", async (req, res): Promise<void> => {
  const detections = await db.select().from(threatDetectionsTable).orderBy(desc(threatDetectionsTable.detectedAt)).limit(30);
  res.json(detections.map((d) => ({ ...d, detectedAt: d.detectedAt.toISOString() })));
});

export default router;
