import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  agentStatesTable,
  attackActionsTable,
  findingsTable,
  attackGraphNodesTable,
  attackGraphEdgesTable,
  simulationsTable,
  simulationEventsTable,
  networkAssetsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { chatJSON } from "../lib/openai";

const router: IRouter = Router();

const PHASES = ["reconnaissance", "exploitation", "persistence", "lateral_movement", "exfiltration"];

router.get("/red-team/status", async (req, res): Promise<void> => {
  const [state] = await db.select().from(agentStatesTable).where(eq(agentStatesTable.agent, "red_team"));
  if (!state) {
    res.json({ agent: "red_team", state: "idle", currentObjective: "Awaiting simulation start", actionsCompleted: 0, reasoning: "", lastActionAt: null, memoryContext: null });
    return;
  }
  res.json({ ...state, lastActionAt: state.lastActionAt?.toISOString() ?? null });
});

router.get("/red-team/attacks", async (req, res): Promise<void> => {
  const attacks = await db.select().from(attackActionsTable).orderBy(desc(attackActionsTable.timestamp)).limit(50);
  res.json(attacks.map((a) => ({ ...a, timestamp: a.timestamp.toISOString(), mitreId: a.mitreId ?? null, impact: a.impact ?? null, reasoning: a.reasoning ?? null })));
});

router.get("/red-team/attack-graph", async (req, res): Promise<void> => {
  const nodes = await db.select().from(attackGraphNodesTable);
  const edges = await db.select().from(attackGraphEdgesTable);
  const assets = await db.select().from(networkAssetsTable);
  
  const assetMap = new Map(assets.map((a) => [a.id, a]));
  const nodesWithCoords = nodes.map((n) => {
    const asset = n.assetId ? assetMap.get(n.assetId) : null;
    return {
      id: n.nodeId,
      label: n.label,
      type: n.type,
      status: n.status,
      assetId: n.assetId ?? null,
      riskScore: n.riskScore ?? null,
      x: asset ? asset.x : null,
      y: asset ? asset.y : null,
    };
  });

  const compromisedNodes = nodes.filter((n) => n.status === "compromised").map((n) => n.nodeId);
  res.json({
    nodes: nodesWithCoords,
    edges: edges.map((e) => ({ source: e.source, target: e.target, technique: e.technique, status: e.status })),
    compromisedPath: compromisedNodes,
  });
});

router.post("/red-team/execute", async (req, res): Promise<void> => {
  const [sim] = await db.select().from(simulationsTable).orderBy(desc(simulationsTable.id)).limit(1);
  if (!sim || sim.state !== "running") {
    res.status(400).json({ error: "Simulation not running" });
    return;
  }

  const assets = await db.select().from(networkAssetsTable);
  const [agentState] = await db.select().from(agentStatesTable).where(eq(agentStatesTable.agent, "red_team"));
  const recentAttacks = await db.select().from(attackActionsTable).orderBy(desc(attackActionsTable.timestamp)).limit(5);

  type StepResult = { action: string; reasoning: string; outcome: string; technique: string; mitreId: string; targetAsset: string; nextStep: string; impact: string; newFinding?: { type: string; title: string; severity: string; cveId?: string; description: string } };

  const result = await chatJSON<StepResult>(
    `You are an autonomous AI Red Team agent performing a ${sim.scenario} attack simulation (difficulty: ${sim.difficulty}).
    Current phase: ${sim.phase}. Actions completed: ${agentState?.actionsCompleted ?? 0}.
    Network assets: ${assets.map((a) => `${a.name} (${a.type}, ${a.ipAddress}, status: ${a.status}, compromised: ${a.compromiseLevel}%)`).join("; ")}.
    Recent actions: ${recentAttacks.map((a) => a.technique).join(", ") || "none"}.
    Memory: ${agentState?.memoryContext ?? "Fresh start"}.
    
    Respond with JSON: { action, reasoning, outcome (success|partial|failed|detected|blocked), technique, mitreId, targetAsset, nextStep, impact, newFinding?: { type, title, severity, cveId, description } }
    
    Be specific and realistic. Use real MITRE ATT&CK technique names and IDs. Reference actual assets from the network.`,
    `Execute the next ${sim.phase} attack step. Think step-by-step. What is the most logical attack vector right now?`
  );

  const targetAsset = assets.find((a) => a.name === result.targetAsset) ?? assets[0];
  const newCompromise = result.outcome === "success" ? Math.min(100, (targetAsset?.compromiseLevel ?? 0) + 25) : targetAsset?.compromiseLevel ?? 0;
  const newStatus = newCompromise >= 75 ? "compromised" : newCompromise > 0 ? "targeted" : targetAsset?.status ?? "healthy";

  if (targetAsset) {
    await db.update(networkAssetsTable).set({ compromiseLevel: newCompromise, status: newStatus }).where(eq(networkAssetsTable.id, targetAsset.id));
    await db.update(attackGraphNodesTable).set({ status: newStatus }).where(eq(attackGraphNodesTable.nodeId, `asset_${targetAsset.id}`));
  }

  const [attack] = await db.insert(attackActionsTable).values({
    simulationId: sim.id, phase: sim.phase, technique: result.technique, mitreId: result.mitreId, target: result.targetAsset, status: result.outcome === "success" ? "success" : result.outcome === "blocked" ? "failed" : "executing", impact: result.impact, reasoning: result.reasoning,
  }).returning();

  const newActions = (agentState?.actionsCompleted ?? 0) + 1;
  let nextPhase = sim.phase;
  if (newActions % 3 === 0) {
    const idx = PHASES.indexOf(sim.phase);
    nextPhase = PHASES[Math.min(idx + 1, PHASES.length - 1)];
    await db.update(simulationsTable).set({ phase: nextPhase, redTeamScore: (sim.redTeamScore ?? 0) + (result.outcome === "success" ? 10 : 2) }).where(eq(simulationsTable.id, sim.id));
  }

  await db.update(agentStatesTable).set({
    state: "executing", currentObjective: result.nextStep, actionsCompleted: newActions, reasoning: result.reasoning, memoryContext: `${agentState?.memoryContext ?? ""}\n[${sim.phase}] ${result.action} → ${result.outcome}`.slice(-2000), lastActionAt: new Date(),
  }).where(eq(agentStatesTable.agent, "red_team"));

  const [event] = await db.insert(simulationEventsTable).values({
    simulationId: sim.id, type: "attack", actor: "red_team", description: `${result.technique}: ${result.action}`, severity: result.outcome === "success" ? "high" : "medium", assetId: targetAsset?.id, assetName: targetAsset?.name, technique: result.technique, mitreId: result.mitreId,
  }).returning();

  if (result.newFinding) {
    await db.insert(findingsTable).values({ simulationId: sim.id, type: result.newFinding.type ?? "vulnerability", title: result.newFinding.title, severity: result.newFinding.severity, asset: result.targetAsset, cveId: result.newFinding.cveId ?? null, description: result.newFinding.description, exploitable: result.outcome === "success" });
  }

  res.json({
    agent: "red_team", action: result.action, reasoning: result.reasoning, outcome: result.outcome, nextStep: result.nextStep, technique: result.technique, mitreId: result.mitreId, affectedAssets: [result.targetAsset],
    generatedEvents: [{ ...event, timestamp: event.timestamp.toISOString(), assetId: event.assetId ?? null, assetName: event.assetName ?? null, technique: event.technique ?? null, mitreId: event.mitreId ?? null }],
  });
});

router.get("/red-team/findings", async (req, res): Promise<void> => {
  const findings = await db.select().from(findingsTable).orderBy(desc(findingsTable.timestamp)).limit(50);
  res.json(findings.map((f) => ({ ...f, cveId: f.cveId ?? null, timestamp: f.timestamp.toISOString() })));
});

export default router;
