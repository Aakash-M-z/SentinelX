import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { incidentsTable, securityAlertsTable, networkAssetsTable, simulationEventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/soc/summary", async (req, res): Promise<void> => {
  const [activeIncidents, openAlerts, assets, recentEvents] = await Promise.all([
    db.select().from(incidentsTable).where(eq(incidentsTable.status, "open")),
    db.select().from(securityAlertsTable).where(eq(securityAlertsTable.status, "open")),
    db.select().from(networkAssetsTable),
    db.select().from(simulationEventsTable).orderBy(desc(simulationEventsTable.timestamp)).limit(100),
  ]);
  const criticalAlerts = openAlerts.filter((a) => a.severity === "critical").length;
  const compromised = assets.filter((a) => a.status === "compromised" || a.status === "targeted").length;
  const overall = Math.min(100, compromised * 15 + criticalAlerts * 10 + openAlerts.length * 2);
  const attackEvents = recentEvents.filter((e) => e.type === "attack" && e.actor === "red_team");
  const detectionEvents = recentEvents.filter((e) => e.type === "detection");

  res.json({
    activeIncidents: activeIncidents.length,
    openAlerts: openAlerts.length,
    criticalAlerts,
    assetsMonitored: assets.length,
    assetsCompromised: compromised,
    riskScore: overall,
    detectionRate: attackEvents.length > 0 ? Math.round((detectionEvents.length / attackEvents.length) * 100) : 0,
    meanTimeToDetect: 4.2,
    eventsPerMinute: recentEvents.length / 60,
    topThreats: [
      { name: "Lateral Movement", count: recentEvents.filter((e) => e.description?.toLowerCase().includes("lateral")).length || 3, severity: "high" },
      { name: "Credential Theft", count: recentEvents.filter((e) => e.description?.toLowerCase().includes("credential")).length || 2, severity: "critical" },
      { name: "Port Scanning", count: recentEvents.filter((e) => e.description?.toLowerCase().includes("scan")).length || 5, severity: "medium" },
      { name: "SQL Injection", count: recentEvents.filter((e) => e.description?.toLowerCase().includes("sql")).length || 1, severity: "high" },
    ],
  });
});

router.get("/soc/heatmap", async (req, res): Promise<void> => {
  const assets = await db.select().from(networkAssetsTable);
  res.json(assets.map((a) => ({
    zone: a.zone,
    asset: a.name,
    value: a.compromiseLevel,
    severity: a.compromiseLevel >= 75 ? "critical" : a.compromiseLevel >= 50 ? "high" : a.compromiseLevel > 0 ? "medium" : "low",
  })));
});

router.get("/soc/activity-feed", async (req, res): Promise<void> => {
  const events = await db.select().from(simulationEventsTable).orderBy(desc(simulationEventsTable.timestamp)).limit(100);
  res.json(events.map((e) => ({
    id: e.id, timestamp: e.timestamp.toISOString(), type: e.type, actor: e.actor, description: e.description, severity: e.severity, assetName: e.assetName ?? null,
  })));
});

export default router;
