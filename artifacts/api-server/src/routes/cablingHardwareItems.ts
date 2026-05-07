import { Router, type IRouter } from "express";
import { eq, max } from "drizzle-orm";
import {
  db,
  estimatesTable,
  cablingHardwareItemsTable,
} from "@workspace/db";
import { apiSchemas } from "@workspace/api-zod";

const router: IRouter = Router();

const round2 = (n: number) => Math.round(n * 100) / 100;

router.post(
  "/estimates/:id/hardware-items",
  async (req, res): Promise<void> => {
    const params = apiSchemas.CreateCablingHardwareItemParams.safeParse(
      req.params,
    );
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsed = apiSchemas.CreateCablingHardwareItemBody.safeParse(req.body);
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
      .select({ value: max(cablingHardwareItemsTable.sortOrder) })
      .from(cablingHardwareItemsTable)
      .where(eq(cablingHardwareItemsTable.estimateId, params.data.id));
    const nextOrder = (maxOrder?.value ?? -1) + 1;

    const [created] = await db
      .insert(cablingHardwareItemsTable)
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
      .update(estimatesTable)
      .set({ updatedAt: new Date() })
      .where(eq(estimatesTable.id, params.data.id));

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

router.put("/hardware-items/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.UpdateCablingHardwareItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = apiSchemas.UpdateCablingHardwareItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(cablingHardwareItemsTable)
    .set({
      catalogKey: parsed.data.catalogKey ?? null,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      unitCost: parsed.data.unitCost,
      unit: parsed.data.unit ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(cablingHardwareItemsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Hardware item not found" });
    return;
  }

  await db
    .update(estimatesTable)
    .set({ updatedAt: new Date() })
    .where(eq(estimatesTable.id, updated.estimateId));

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

router.delete("/hardware-items/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.DeleteCablingHardwareItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(cablingHardwareItemsTable)
    .where(eq(cablingHardwareItemsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Hardware item not found" });
    return;
  }

  await db
    .update(estimatesTable)
    .set({ updatedAt: new Date() })
    .where(eq(estimatesTable.id, deleted.estimateId));

  res.sendStatus(204);
});

export default router;
