import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { incidentsTable, timelineEventsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { chatJSON } from "../lib/openai";

const router: IRouter = Router();

function formatIncident(i: typeof incidentsTable.$inferSelect) {
  return { ...i, assignee: i.assignee ?? null, rootCause: i.rootCause ?? null, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString(), resolvedAt: i.resolvedAt?.toISOString() ?? null };
}

router.get("/incidents", async (req, res): Promise<void> => {
  const incidents = await db.select().from(incidentsTable).orderBy(desc(incidentsTable.createdAt)).limit(30);
  res.json(incidents.map(formatIncident));
});

router.post("/incidents", async (req, res): Promise<void> => {
  const { title, severity, description, affectedAssets = [] } = req.body;
  if (!title || !severity || !description) { res.status(400).json({ error: "title, severity, description required" }); return; }
  const [incident] = await db.insert(incidentsTable).values({ title, severity, description, affectedAssets, status: "open" }).returning();
  await db.insert(timelineEventsTable).values({ incidentId: incident.id, type: "escalation", description: `Incident created: ${title}`, actor: "SOC Analyst" });
  res.status(201).json(formatIncident(incident));
});

router.get("/incidents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [incident] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
  if (!incident) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatIncident(incident));
});

router.patch("/incidents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status, severity, assignee, rootCause } = req.body;
  const updateData: Partial<typeof incidentsTable.$inferSelect> = { updatedAt: new Date() };
  if (status) updateData.status = status;
  if (severity) updateData.severity = severity;
  if (assignee !== undefined) updateData.assignee = assignee;
  if (rootCause !== undefined) updateData.rootCause = rootCause;
  if (status === "resolved") updateData.resolvedAt = new Date();
  const [updated] = await db.update(incidentsTable).set(updateData).where(eq(incidentsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatIncident(updated));
});

router.get("/incidents/:id/timeline", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const events = await db.select().from(timelineEventsTable).where(eq(timelineEventsTable.incidentId, id)).orderBy(timelineEventsTable.timestamp);
  res.json(events.map((e) => ({ ...e, evidence: e.evidence ?? null, assetId: e.assetId ?? null, timestamp: e.timestamp.toISOString() })));
});

router.post("/incidents/:id/playbook", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { playbookType } = req.body;
  if (!playbookType) { res.status(400).json({ error: "playbookType required" }); return; }
  const [incident] = await db.select().from(incidentsTable).where(eq(incidentsTable.id, id));
  if (!incident) { res.status(404).json({ error: "Not found" }); return; }

  type PlaybookResult = { steps: { step: string; status: string; output: string }[]; success: boolean; summary: string };
  const result = await chatJSON<PlaybookResult>(
    `You are an incident response automation system. Generate a realistic playbook execution result.
    Playbook: ${playbookType}. Incident: ${incident.title} (${incident.severity}).
    Respond with JSON: { steps: [{ step, status (completed|failed|skipped), output }], success, summary }`,
    `Execute the ${playbookType} playbook for this incident.`
  );

  await db.insert(timelineEventsTable).values({ incidentId: id, type: "response", description: `Playbook executed: ${playbookType}`, actor: "Automated Response" });

  res.json({ playbookType, ...result });
});

export default router;
