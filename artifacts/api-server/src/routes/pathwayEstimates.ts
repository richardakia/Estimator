import { Router, type IRouter } from "express";
import { eq, desc, asc } from "drizzle-orm";
import {
  db,
  pathwayEstimatesTable,
  pathwaySegmentsTable,
} from "@workspace/db";
import { apiSchemas } from "@workspace/api-zod";
import { getRates } from "../lib/ratesStore";
import {
  calculatePathwaySegment,
  resolvePathwayRatesFromConfig,
} from "../lib/pathwayCalculator";

const router: IRouter = Router();

router.get("/pathway-estimates", async (_req, res): Promise<void> => {
  const estimates = await db
    .select()
    .from(pathwayEstimatesTable)
    .orderBy(desc(pathwayEstimatesTable.updatedAt));

  const rates = await getRates();
  const pathwayRates = resolvePathwayRatesFromConfig(rates);

  const summaries = await Promise.all(
    estimates.map(async (e) => {
      const segments = await db
        .select()
        .from(pathwaySegmentsTable)
        .where(eq(pathwaySegmentsTable.estimateId, e.id));

      let totalLengthFt = 0;
      let totalLaborHrs = 0;
      let totalCost = 0;
      for (const s of segments) {
        totalLengthFt += s.lengthFt;
        const r = calculatePathwaySegment(
          {
            pathwayType: s.pathwayType,
            lengthFt: s.lengthFt,
            mountingHeight: s.mountingHeight,
            ceilingType: s.ceilingType,
            cableFill: s.cableFill,
            bends: s.bends,
            penetrations: s.penetrations,
          },
          e.hourlyRate,
          pathwayRates,
        );
        totalLaborHrs += r.totalLaborHrs;
        totalCost += r.totalCost;
      }

      return {
        id: e.id,
        name: e.name,
        hourlyRate: e.hourlyRate,
        segmentCount: segments.length,
        totalLengthFt,
        totalLaborHrs,
        totalCost,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      };
    }),
  );

  res.json(summaries);
});

router.post("/pathway-estimates", async (req, res): Promise<void> => {
  const parsed = apiSchemas.CreatePathwayEstimateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(pathwayEstimatesTable)
    .values({
      name: parsed.data.name,
      hourlyRate: parsed.data.hourlyRate,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  if (!created) {
    res.status(500).json({ error: "Failed to create pathway estimate" });
    return;
  }

  res.status(201).json({
    id: created.id,
    name: created.name,
    hourlyRate: created.hourlyRate,
    notes: created.notes,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
});

router.get("/pathway-estimates/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.GetPathwayEstimateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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

  const segments = await db
    .select()
    .from(pathwaySegmentsTable)
    .where(eq(pathwaySegmentsTable.estimateId, estimate.id))
    .orderBy(asc(pathwaySegmentsTable.sortOrder), asc(pathwaySegmentsTable.id));

  const rates = await getRates();
  const pathwayRates = resolvePathwayRatesFromConfig(rates);

  let totalLengthFt = 0;
  let totalLaborHrs = 0;
  let totalLaborCost = 0;
  let totalMaterialCost = 0;
  let totalFasteners = 0;
  let totalCost = 0;

  const calcSegments = segments.map((s) => {
    const r = calculatePathwaySegment(
      {
        pathwayType: s.pathwayType,
        lengthFt: s.lengthFt,
        mountingHeight: s.mountingHeight,
        ceilingType: s.ceilingType,
        cableFill: s.cableFill,
        bends: s.bends,
        penetrations: s.penetrations,
      },
      estimate.hourlyRate,
      pathwayRates,
    );
    totalLengthFt += s.lengthFt;
    totalLaborHrs += r.totalLaborHrs;
    totalLaborCost += r.laborCost;
    totalMaterialCost += r.totalMaterialCost;
    totalFasteners += r.fastenerCount;
    totalCost += r.totalCost;
    return {
      segmentId: s.id,
      label: s.label,
      pathwayType: s.pathwayType,
      lengthFt: s.lengthFt,
      mountingHeight: s.mountingHeight,
      ceilingType: s.ceilingType,
      cableFill: s.cableFill,
      bends: s.bends,
      penetrations: s.penetrations,
      notes: s.notes,
      sortOrder: s.sortOrder,
      ...r,
    };
  });

  res.json({
    estimate: {
      id: estimate.id,
      name: estimate.name,
      hourlyRate: estimate.hourlyRate,
      notes: estimate.notes,
      createdAt: estimate.createdAt.toISOString(),
      updatedAt: estimate.updatedAt.toISOString(),
    },
    segments: calcSegments,
    totals: {
      segmentCount: segments.length,
      totalLengthFt,
      totalLaborHrs,
      totalLaborCost,
      totalMaterialCost,
      totalFasteners,
      totalCost,
    },
  });
});

router.put("/pathway-estimates/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.UpdatePathwayEstimateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = apiSchemas.UpdatePathwayEstimateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(pathwayEstimatesTable)
    .set({
      name: parsed.data.name,
      hourlyRate: parsed.data.hourlyRate,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(pathwayEstimatesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Pathway estimate not found" });
    return;
  }

  res.json({
    id: updated.id,
    name: updated.name,
    hourlyRate: updated.hourlyRate,
    notes: updated.notes,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/pathway-estimates/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.DeletePathwayEstimateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(pathwayEstimatesTable)
    .where(eq(pathwayEstimatesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Pathway estimate not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
