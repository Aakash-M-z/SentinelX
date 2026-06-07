import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { threatIntelTable, threatActorsTable, iocsTable, attackActionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/threats", async (req, res): Promise<void> => {
  const threats = await db.select().from(threatIntelTable).orderBy(desc(threatIntelTable.cvssScore)).limit(50);
  res.json(threats.map((t) => ({ ...t, mitreId: t.mitreId ?? null, published: t.published.toISOString() })));
});

router.get("/threats/actors", async (req, res): Promise<void> => {
  const actors = await db.select().from(threatActorsTable);
  res.json(actors);
});

router.get("/threats/mitre-coverage", async (req, res): Promise<void> => {
  const attacks = await db.select().from(attackActionsTable).limit(100);
  const detectedIds = new Set(attacks.map((a) => a.mitreId).filter(Boolean));

  const tactics = [
    { id: "TA0043", name: "Reconnaissance", techniqueCount: 10, coveredCount: detectedIds.has("T1595") ? 3 : 0 },
    { id: "TA0042", name: "Resource Development", techniqueCount: 8, coveredCount: 0 },
    { id: "TA0001", name: "Initial Access", techniqueCount: 9, coveredCount: detectedIds.size > 0 ? 2 : 0 },
    { id: "TA0002", name: "Execution", techniqueCount: 14, coveredCount: detectedIds.size > 1 ? 3 : 0 },
    { id: "TA0003", name: "Persistence", techniqueCount: 19, coveredCount: detectedIds.size > 2 ? 4 : 0 },
    { id: "TA0004", name: "Privilege Escalation", techniqueCount: 13, coveredCount: detectedIds.size > 3 ? 2 : 0 },
    { id: "TA0005", name: "Defense Evasion", techniqueCount: 42, coveredCount: detectedIds.size > 4 ? 5 : 0 },
    { id: "TA0006", name: "Credential Access", techniqueCount: 17, coveredCount: detectedIds.size > 2 ? 3 : 0 },
    { id: "TA0007", name: "Discovery", techniqueCount: 31, coveredCount: detectedIds.size > 0 ? 6 : 0 },
    { id: "TA0008", name: "Lateral Movement", techniqueCount: 9, coveredCount: detectedIds.size > 5 ? 2 : 0 },
    { id: "TA0009", name: "Collection", techniqueCount: 17, coveredCount: detectedIds.size > 6 ? 3 : 0 },
    { id: "TA0011", name: "Command and Control", techniqueCount: 16, coveredCount: detectedIds.size > 3 ? 4 : 0 },
    { id: "TA0010", name: "Exfiltration", techniqueCount: 9, coveredCount: detectedIds.size > 7 ? 2 : 0 },
    { id: "TA0040", name: "Impact", techniqueCount: 13, coveredCount: 0 },
  ];

  const techniques = attacks.map((a, i) => ({
    id: a.mitreId ?? `T${1000 + i}`, name: a.technique, tactic: a.phase, detected: a.status === "success" || a.status === "detected", blocked: a.status === "failed", severity: "high",
  })).filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  const covered = tactics.reduce((s, t) => s + t.coveredCount, 0);
  const total = tactics.reduce((s, t) => s + t.techniqueCount, 0);

  res.json({ tactics, techniques, covered, total, coveragePercent: Math.round((covered / total) * 100) });
});

router.get("/threats/iocs", async (req, res): Promise<void> => {
  const iocs = await db.select().from(iocsTable).orderBy(desc(iocsTable.firstSeen)).limit(50);
  res.json(iocs.map((i) => ({ ...i, associatedActor: i.associatedActor ?? null, firstSeen: i.firstSeen.toISOString(), lastSeen: i.lastSeen?.toISOString() ?? null })));
});

export default router;
