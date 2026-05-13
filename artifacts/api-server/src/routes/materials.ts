import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, materialsTable } from "@workspace/db";
import { apiSchemas } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/materials", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(materialsTable)
    .orderBy(materialsTable.name);

  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      cost: r.cost,
      classification: r.classification,
      manufacturer: r.manufacturer,
      partNumber: r.partNumber,
      unit: r.unit,
      supplier: r.supplier,
      notes: r.notes,
      tags: r.tags,
      isActive: r.isActive,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  );
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

  res.status(201).json({
    id: created.id,
    name: created.name,
    description: created.description,
    cost: created.cost,
    classification: created.classification,
    manufacturer: created.manufacturer,
    partNumber: created.partNumber,
    unit: created.unit,
    supplier: created.supplier,
    notes: created.notes,
    tags: created.tags,
    isActive: created.isActive,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
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

  res.json({
    id: row.id,
    name: row.name,
    description: row.description,
    cost: row.cost,
    classification: row.classification,
    manufacturer: row.manufacturer,
    partNumber: row.partNumber,
    unit: row.unit,
    supplier: row.supplier,
    notes: row.notes,
    tags: row.tags,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
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

  res.json({
    id: updated.id,
    name: updated.name,
    description: updated.description,
    cost: updated.cost,
    classification: updated.classification,
    manufacturer: updated.manufacturer,
    partNumber: updated.partNumber,
    unit: updated.unit,
    supplier: updated.supplier,
    notes: updated.notes,
    tags: updated.tags,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
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
