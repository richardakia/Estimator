import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, materialsTable } from "@workspace/db";
import { apiSchemas } from "@workspace/api-zod";

const router: IRouter = Router();

function serializeRow(r: typeof materialsTable.$inferSelect) {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    cost: r.cost,
    classification: r.classification,
    manufacturer: r.manufacturer,
    partNumber: r.partNumber,
    cableType: r.cableType,
    unit: r.unit,
    supplier: r.supplier,
    notes: r.notes,
    tags: r.tags,
    isActive: r.isActive,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/materials", async (_req, res): Promise<void> => {
  const rows = await db.select().from(materialsTable).orderBy(materialsTable.name);
  res.json(rows.map(serializeRow));
});

router.post("/materials", async (req, res): Promise<void> => {
  const parsed = apiSchemas.CreateMaterialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(materialsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      cost: parsed.data.cost,
      classification: parsed.data.classification ?? null,
      manufacturer: parsed.data.manufacturer ?? null,
      partNumber: parsed.data.partNumber ?? null,
      cableType: parsed.data.cableType ?? null,
      unit: parsed.data.unit ?? null,
      supplier: parsed.data.supplier ?? null,
      notes: parsed.data.notes ?? null,
      tags: parsed.data.tags ?? null,
      isActive: parsed.data.isActive ?? true,
    })
    .returning();

  if (!created) {
    res.status(500).json({ error: "Failed to create material" });
    return;
  }

  res.status(201).json(serializeRow(created));
});

router.get("/materials/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.GetMaterialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(materialsTable)
    .where(eq(materialsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Material not found" });
    return;
  }

  res.json(serializeRow(row));
});

router.put("/materials/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.UpdateMaterialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = apiSchemas.UpdateMaterialBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(materialsTable)
    .set({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      cost: parsed.data.cost,
      classification: parsed.data.classification ?? null,
      manufacturer: parsed.data.manufacturer ?? null,
      partNumber: parsed.data.partNumber ?? null,
      cableType: parsed.data.cableType ?? null,
      unit: parsed.data.unit ?? null,
      supplier: parsed.data.supplier ?? null,
      notes: parsed.data.notes ?? null,
      tags: parsed.data.tags ?? null,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(materialsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Material not found" });
    return;
  }

  res.json(serializeRow(updated));
});

router.delete("/materials/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.DeleteMaterialParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(materialsTable)
    .where(eq(materialsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Material not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
