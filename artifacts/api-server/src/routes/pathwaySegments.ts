import { Router, type IRouter } from "express";
import { eq, max } from "drizzle-orm";
import {
  db,
  pathwayEstimatesTable,
  pathwaySegmentsTable,
} from "@workspace/db";
import { apiSchemas } from "@workspace/api-zod";

const router: IRouter = Router();

router.post(
  "/pathway-estimates/:id/segments",
  async (req, res): Promise<void> => {
    const params = apiSchemas.CreatePathwaySegmentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = apiSchemas.CreatePathwaySegmentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [estimate] = await db
      .select()
      .from(pathwayEstimatesTable)
      .where(eq(pathwayEstimatesTable.id, params.data.id));
    if (!estimate) {
      res.status(404).json({ error: "Pathway estimate not found" });
      return;
    }

    const [maxOrder] = await db
      .select({ value: max(pathwaySegmentsTable.sortOrder) })
      .from(pathwaySegmentsTable)
      .where(eq(pathwaySegmentsTable.estimateId, params.data.id));

    const nextOrder = (maxOrder?.value ?? -1) + 1;

    const [created] = await db
      .insert(pathwaySegmentsTable)
      .values({
        estimateId: params.data.id,
        label: parsed.data.label,
        pathwayType: parsed.data.pathwayType,
        lengthFt: parsed.data.lengthFt,
        mountingHeight: parsed.data.mountingHeight,
        ceilingType: parsed.data.ceilingType,
        cableFill: parsed.data.cableFill,
        bends: parsed.data.bends,
        penetrations: parsed.data.penetrations,
        notes: parsed.data.notes ?? null,
        sortOrder: nextOrder,
      })
      .returning();

    if (!created) {
      res.status(500).json({ error: "Failed to create segment" });
      return;
    }

    await db
      .update(pathwayEstimatesTable)
      .set({ updatedAt: new Date() })
      .where(eq(pathwayEstimatesTable.id, params.data.id));

    res.status(201).json({
      id: created.id,
      estimateId: created.estimateId,
      label: created.label,
      pathwayType: created.pathwayType,
      lengthFt: created.lengthFt,
      mountingHeight: created.mountingHeight,
      ceilingType: created.ceilingType,
      cableFill: created.cableFill,
      bends: created.bends,
      penetrations: created.penetrations,
      notes: created.notes,
      sortOrder: created.sortOrder,
      createdAt: created.createdAt.toISOString(),
    });
  },
);

router.put("/pathway-segments/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.UpdatePathwaySegmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = apiSchemas.UpdatePathwaySegmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(pathwaySegmentsTable)
    .set({
      label: parsed.data.label,
      pathwayType: parsed.data.pathwayType,
      lengthFt: parsed.data.lengthFt,
      mountingHeight: parsed.data.mountingHeight,
      ceilingType: parsed.data.ceilingType,
      cableFill: parsed.data.cableFill,
      bends: parsed.data.bends,
      penetrations: parsed.data.penetrations,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(pathwaySegmentsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Segment not found" });
    return;
  }

  await db
    .update(pathwayEstimatesTable)
    .set({ updatedAt: new Date() })
    .where(eq(pathwayEstimatesTable.id, updated.estimateId));

  res.json({
    id: updated.id,
    estimateId: updated.estimateId,
    label: updated.label,
    pathwayType: updated.pathwayType,
    lengthFt: updated.lengthFt,
    mountingHeight: updated.mountingHeight,
    ceilingType: updated.ceilingType,
    cableFill: updated.cableFill,
    bends: updated.bends,
    penetrations: updated.penetrations,
    notes: updated.notes,
    sortOrder: updated.sortOrder,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/pathway-segments/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.DeletePathwaySegmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(pathwaySegmentsTable)
    .where(eq(pathwaySegmentsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Segment not found" });
    return;
  }

  await db
    .update(pathwayEstimatesTable)
    .set({ updatedAt: new Date() })
    .where(eq(pathwayEstimatesTable.id, deleted.estimateId));

  res.sendStatus(204);
});

export default router;
