import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { copilotMessagesTable, simulationsTable, networkAssetsTable, securityAlertsTable, findingsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { chatText } from "../lib/openai";

const router: IRouter = Router();

router.get("/copilot/history", async (req, res): Promise<void> => {
  const messages = await db.select().from(copilotMessagesTable).orderBy(copilotMessagesTable.timestamp).limit(100);
  res.json(messages.map((m) => ({ ...m, context: m.context ?? null, timestamp: m.timestamp.toISOString() })));
});

router.post("/copilot/chat", async (req, res): Promise<void> => {
  const { message, context } = req.body;
  if (!message) { res.status(400).json({ error: "message required" }); return; }

  const [sim] = await db.select().from(simulationsTable).orderBy(desc(simulationsTable.id)).limit(1);
  const assets = await db.select().from(networkAssetsTable);
  const alerts = await db.select().from(securityAlertsTable).orderBy(desc(securityAlertsTable.timestamp)).limit(5);
  const findings = await db.select().from(findingsTable).orderBy(desc(findingsTable.timestamp)).limit(5);

  const systemPrompt = `You are SentinelX Security Copilot — an expert AI security analyst embedded in the SentinelX cyber range platform.
You have full situational awareness of the ongoing simulation.

Current simulation: ${sim?.scenario ?? "none"} | Phase: ${sim?.phase ?? "idle"} | State: ${sim?.state ?? "idle"}
Red Team Score: ${sim?.redTeamScore ?? 0} | Blue Team Score: ${sim?.blueTeamScore ?? 0}

Network status: ${assets.filter((a) => a.status !== "healthy").map((a) => `${a.name} (${a.status}, ${a.compromiseLevel}% compromised)`).join("; ") || "All systems healthy"}

Active alerts: ${alerts.map((a) => `${a.title} [${a.severity}]`).join("; ") || "None"}

Recent findings: ${findings.map((f) => `${f.title} [${f.severity}]`).join("; ") || "None"}

Context mode: ${context ?? "general"}

Respond as a professional cybersecurity analyst. Be concise, actionable, and technically accurate. Use MITRE ATT&CK framework references where appropriate. For executive questions, provide business impact context.`;

  const history = await db.select().from(copilotMessagesTable).orderBy(copilotMessagesTable.timestamp).limit(20);

  await db.insert(copilotMessagesTable).values({ role: "user", content: message, context: context ?? null });

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: message },
  ];

  const assistantContent = await chatText(messages).catch((err) => {
    console.error("[Copilot Chat Error]", err);
    return "I'm analyzing the current threat landscape. Please try again.";
  });

  const [saved] = await db.insert(copilotMessagesTable).values({ role: "assistant", content: assistantContent, context: context ?? null }).returning();

  res.json({ ...saved, context: saved.context ?? null, timestamp: saved.timestamp.toISOString() });
});

export default router;
