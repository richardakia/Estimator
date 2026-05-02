import { Router, type IRouter } from "express";
import { eq, max } from "drizzle-orm";
import { db, estimatesTable, runsTable } from "@workspace/db";
import { apiSchemas } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/estimates/:id/runs", async (req, res): Promise<void> => {
  const params = apiSchemas.CreateRunParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = apiSchemas.CreateRunBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [estimate] = await db
    .select()
    .from(estimatesTable)
    .where(eq(estimatesTable.id, params.data.id));
  if (!estimate) {
    res.status(404).json({ error: "Estimate not found" });
    return;
  }

  const [maxOrder] = await db
    .select({ value: max(runsTable.sortOrder) })
    .from(runsTable)
    .where(eq(runsTable.estimateId, params.data.id));

  const nextOrder = (maxOrder?.value ?? -1) + 1;

  const [created] = await db
    .insert(runsTable)
    .values({
      estimateId: params.data.id,
      label: parsed.data.label,
      cableType: parsed.data.cableType,
      numCables: parsed.data.numCables,
      lengthFt: parsed.data.lengthFt,
      ceilingType: parsed.data.ceilingType,
      pathwayComplexity: parsed.data.pathwayComplexity,
      bulkSize: parsed.data.bulkSize,
      sortOrder: nextOrder,
    })
    .returning();

  if (!created) {
    res.status(500).json({ error: "Failed to create run" });
    return;
  }

  await db
    .update(estimatesTable)
    .set({ updatedAt: new Date() })
    .where(eq(estimatesTable.id, params.data.id));

  res.status(201).json({
    id: created.id,
    estimateId: created.estimateId,
    label: created.label,
    cableType: created.cableType,
    numCables: created.numCables,
    lengthFt: created.lengthFt,
    ceilingType: created.ceilingType,
    pathwayComplexity: created.pathwayComplexity,
    bulkSize: created.bulkSize,
    sortOrder: created.sortOrder,
    createdAt: created.createdAt.toISOString(),
  });
});

router.put("/runs/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.UpdateRunParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = apiSchemas.UpdateRunBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(runsTable)
    .set({
      label: parsed.data.label,
      cableType: parsed.data.cableType,
      numCables: parsed.data.numCables,
      lengthFt: parsed.data.lengthFt,
      ceilingType: parsed.data.ceilingType,
      pathwayComplexity: parsed.data.pathwayComplexity,
      bulkSize: parsed.data.bulkSize,
    })
    .where(eq(runsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  await db
    .update(estimatesTable)
    .set({ updatedAt: new Date() })
    .where(eq(estimatesTable.id, updated.estimateId));

  res.json({
    id: updated.id,
    estimateId: updated.estimateId,
    label: updated.label,
    cableType: updated.cableType,
    numCables: updated.numCables,
    lengthFt: updated.lengthFt,
    ceilingType: updated.ceilingType,
    pathwayComplexity: updated.pathwayComplexity,
    bulkSize: updated.bulkSize,
    sortOrder: updated.sortOrder,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/runs/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.DeleteRunParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(runsTable)
    .where(eq(runsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  await db
    .update(estimatesTable)
    .set({ updatedAt: new Date() })
    .where(eq(estimatesTable.id, deleted.estimateId));

  res.sendStatus(204);
});

export default router;
