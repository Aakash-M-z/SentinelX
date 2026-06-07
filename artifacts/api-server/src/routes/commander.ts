import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  agentStatesTable,
  executiveReportsTable,
  simulationsTable,
  simulationEventsTable,
  networkAssetsTable,
  attackActionsTable,
  findingsTable,
  securityAlertsTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { chatJSON } from "../lib/openai";

const router: IRouter = Router();

router.get("/commander/report", async (req, res): Promise<void> => {
  const [report] = await db.select().from(executiveReportsTable).orderBy(desc(executiveReportsTable.generatedAt)).limit(1);
  if (!report) {
    res.json({
      id: 0, generatedAt: new Date().toISOString(), executiveSummary: "No simulation has been run yet. Start a simulation to generate an executive report.", technicalSummary: "Awaiting simulation data.", riskLevel: "low", financialImpact: "$0 estimated", mitigations: ["Start a simulation to assess risk"], compliance: { nist: "Not assessed", iso27001: "Not assessed", soc2: "Not assessed" }, attackChainSummary: null,
    });
    return;
  }
  res.json({ ...report, generatedAt: report.generatedAt.toISOString(), compliance: { nist: report.complianceNist, iso27001: report.complianceIso27001, soc2: report.complianceSoc2 }, attackChainSummary: report.attackChainSummary ?? null });
});

router.get("/commander/risk-score", async (req, res): Promise<void> => {
  const assets = await db.select().from(networkAssetsTable);
  const alerts = await db.select().from(securityAlertsTable).where(eq(securityAlertsTable.status, "open"));
  const compromised = assets.filter((a) => a.compromiseLevel > 0);
  const overall = Math.min(100, Math.round((compromised.reduce((s, a) => s + a.compromiseLevel, 0) / Math.max(1, assets.length)) + alerts.filter((a) => a.severity === "critical").length * 10));
  res.json({
    overall,
    categories: {
      network: Math.min(100, overall + 10),
      endpoint: Math.min(100, overall - 5),
      application: Math.min(100, overall + 5),
      data: Math.min(100, overall - 10),
      identity: Math.min(100, overall),
    },
    trend: overall > 70 ? "worsening" : overall > 40 ? "stable" : "improving",
    lastUpdated: new Date().toISOString(),
  });
});

router.post("/commander/analyze", async (req, res): Promise<void> => {
  const [sim] = await db.select().from(simulationsTable).orderBy(desc(simulationsTable.id)).limit(1);
  const assets = await db.select().from(networkAssetsTable);
  const events = await db.select().from(simulationEventsTable).orderBy(desc(simulationEventsTable.timestamp)).limit(20);
  const findings = await db.select().from(findingsTable).limit(10);
  const attacks = await db.select().from(attackActionsTable).orderBy(desc(attackActionsTable.timestamp)).limit(10);

  type Analysis = { action: string; reasoning: string; executiveSummary: string; technicalSummary: string; riskLevel: string; financialImpact: string; mitigations: string[]; nist: string; iso27001: string; soc2: string; attackChainSummary: string; nextStep: string };

  const result = await chatJSON<Analysis>(
    `You are the AI Security Commander — a CISO-level expert providing executive and technical security analysis.
    Scenario: ${sim?.scenario ?? "none"}. Phase: ${sim?.phase ?? "none"}.
    Compromised assets: ${assets.filter((a) => a.status === "compromised").map((a) => a.name).join(", ") || "none"}.
    Critical findings: ${findings.filter((f) => f.severity === "critical").map((f) => f.title).join("; ") || "none"}.
    Recent events: ${events.slice(0, 5).map((e) => e.description).join("; ")}.
    
    Respond with JSON: { action, reasoning, executiveSummary, technicalSummary, riskLevel (low|medium|high|critical), financialImpact (dollar estimate), mitigations (array of strings), nist (compliance status), iso27001 (compliance status), soc2 (compliance status), attackChainSummary, nextStep }`,
    "Generate a comprehensive security analysis for executive leadership and technical teams."
  );

  const [agentState] = await db.select().from(agentStatesTable).where(eq(agentStatesTable.agent, "commander"));
  const newActions = (agentState?.actionsCompleted ?? 0) + 1;
  await db.update(agentStatesTable).set({ state: "executing", currentObjective: result.nextStep, actionsCompleted: newActions, reasoning: result.reasoning, lastActionAt: new Date() }).where(eq(agentStatesTable.agent, "commander"));

  const [report] = await db.insert(executiveReportsTable).values({
    executiveSummary: result.executiveSummary, technicalSummary: result.technicalSummary, riskLevel: result.riskLevel, financialImpact: result.financialImpact, mitigations: result.mitigations, complianceNist: result.nist, complianceIso27001: result.iso27001, complianceSoc2: result.soc2, attackChainSummary: result.attackChainSummary,
  }).returning();

  res.json({
    agent: "commander", action: result.action, reasoning: result.reasoning, outcome: "success", nextStep: result.nextStep, technique: "Threat Analysis", mitreId: null, affectedAssets: assets.filter((a) => a.status !== "healthy").map((a) => a.name),
    generatedEvents: [],
  });
});

export default router;
