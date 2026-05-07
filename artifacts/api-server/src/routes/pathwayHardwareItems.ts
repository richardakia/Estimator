import { Router, type IRouter } from "express";
import { eq, max } from "drizzle-orm";
import {
  db,
  pathwayEstimatesTable,
  pathwayHardwareItemsTable,
} from "@workspace/db";
import { apiSchemas } from "@workspace/api-zod";

const router: IRouter = Router();

const round2 = (n: number) => Math.round(n * 100) / 100;

router.post(
  "/pathway-estimates/:id/hardware-items",
  async (req, res): Promise<void> => {
    const params = apiSchemas.CreatePathwayHardwareItemParams.safeParse(
      req.params,
    );
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = apiSchemas.CreatePathwayHardwareItemBody.safeParse(req.body);
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
      .select({ value: max(pathwayHardwareItemsTable.sortOrder) })
      .from(pathwayHardwareItemsTable)
      .where(eq(pathwayHardwareItemsTable.estimateId, params.data.id));
    const nextOrder = (maxOrder?.value ?? -1) + 1;

    const [created] = await db
      .insert(pathwayHardwareItemsTable)
      .values({
        estimateId: params.data.id,
        catalogKey: parsed.data.catalogKey ?? null,
        name: parsed.data.name,
        quantity: parsed.data.quantity,
        unitCost: parsed.data.unitCost,
        unit: parsed.data.unit ?? null,
        notes: parsed.data.notes ?? null,
        sortOrder: nextOrder,
      })
      .returning();

    if (!created) {
      res.status(500).json({ error: "Failed to create hardware item" });
      return;
    }

    await db
      .update(pathwayEstimatesTable)
      .set({ updatedAt: new Date() })
      .where(eq(pathwayEstimatesTable.id, params.data.id));

    res.status(201).json({
      id: created.id,
      estimateId: created.estimateId,
      catalogKey: created.catalogKey,
      name: created.name,
      quantity: created.quantity,
      unitCost: created.unitCost,
      unit: created.unit,
      notes: created.notes,
      sortOrder: created.sortOrder,
      lineTotal: round2(created.quantity * created.unitCost),
      createdAt: created.createdAt.toISOString(),
    });
  },
);

router.put("/pathway-hardware-items/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.UpdatePathwayHardwareItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = apiSchemas.UpdatePathwayHardwareItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(pathwayHardwareItemsTable)
    .set({
      catalogKey: parsed.data.catalogKey ?? null,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      unitCost: parsed.data.unitCost,
      unit: parsed.data.unit ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(pathwayHardwareItemsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Hardware item not found" });
    return;
  }

  await db
    .update(pathwayEstimatesTable)
    .set({ updatedAt: new Date() })
    .where(eq(pathwayEstimatesTable.id, updated.estimateId));

  res.json({
    id: updated.id,
    estimateId: updated.estimateId,
    catalogKey: updated.catalogKey,
    name: updated.name,
    quantity: updated.quantity,
    unitCost: updated.unitCost,
    unit: updated.unit,
    notes: updated.notes,
    sortOrder: updated.sortOrder,
    lineTotal: round2(updated.quantity * updated.unitCost),
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/pathway-hardware-items/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.DeletePathwayHardwareItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(pathwayHardwareItemsTable)
    .where(eq(pathwayHardwareItemsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Hardware item not found" });
    return;
  }

  await db
    .update(pathwayEstimatesTable)
    .set({ updatedAt: new Date() })
    .where(eq(pathwayEstimatesTable.id, deleted.estimateId));

  res.sendStatus(204);
});

export default router;
