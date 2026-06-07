import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { networkAssetsTable, networkConnectionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function formatAsset(a: typeof networkAssetsTable.$inferSelect) {
  return { ...a, department: a.department ?? null, x: a.x ?? null, y: a.y ?? null };
}

router.get("/assets", async (req, res): Promise<void> => {
  const assets = await db.select().from(networkAssetsTable);
  res.json(assets.map(formatAsset));
});

router.get("/assets/topology", async (req, res): Promise<void> => {
  const assets = await db.select().from(networkAssetsTable);
  const conns = await db.select().from(networkConnectionsTable);
  res.json({
    assets: assets.map(formatAsset),
    connections: conns.map((c) => ({ source: c.sourceId, target: c.targetId, protocol: c.protocol, encrypted: c.encrypted === 1, bandwidth: c.bandwidth ?? null })),
    zones: [
      { id: "dmz", name: "DMZ", color: "#f59e0b", description: "Demilitarized zone — public-facing services", riskLevel: "high" },
      { id: "internal", name: "Internal Network", color: "#3b82f6", description: "Internal corporate network", riskLevel: "medium" },
      { id: "restricted", name: "Restricted", color: "#ef4444", description: "Sensitive systems — domain controllers and databases", riskLevel: "critical" },
      { id: "management", name: "Management", color: "#8b5cf6", description: "IT management and administration", riskLevel: "high" },
    ],
  });
});

router.get("/assets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [asset] = await db.select().from(networkAssetsTable).where(eq(networkAssetsTable.id, id));
  if (!asset) { res.status(404).json({ error: "Asset not found" }); return; }
  res.json(formatAsset(asset));
});

router.patch("/assets/:id/compromise", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { compromiseLevel, status } = req.body;
  const [updated] = await db.update(networkAssetsTable).set({ compromiseLevel, status }).where(eq(networkAssetsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Asset not found" }); return; }
  res.json(formatAsset(updated));
});

export default router;
