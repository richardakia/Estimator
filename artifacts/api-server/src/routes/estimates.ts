import { Router, type IRouter } from "express";
import { eq, desc, asc } from "drizzle-orm";
import { db, estimatesTable, runsTable } from "@workspace/db";
import { apiSchemas } from "@workspace/api-zod";
import { calculateEstimate } from "../lib/calculator";
import type {
  CableType,
  CeilingType,
  PathwayComplexity,
  InstallType,
  BuildingType,
  WorkEnvironment,
  SkillLevel,
  RunInput,
} from "../lib/calculator";
import { getRates } from "../lib/ratesStore";

const router: IRouter = Router();

router.get("/estimates", async (_req, res): Promise<void> => {
  const estimates = await db
    .select()
    .from(estimatesTable)
    .orderBy(desc(estimatesTable.updatedAt));

  const rates = await getRates();

  const summaries = await Promise.all(
    estimates.map(async (e) => {
      const runs = await db
        .select()
        .from(runsTable)
        .where(eq(runsTable.estimateId, e.id));

      const runInputs: RunInput[] = runs.map((r) => ({
        id: r.id,
        label: r.label,
        cableType: r.cableType as CableType,
        numCables: r.numCables,
        lengthFt: r.lengthFt,
        ceilingType: r.ceilingType as CeilingType,
        pathwayComplexity: r.pathwayComplexity as PathwayComplexity,
      }));

      const calc = calculateEstimate(
        {
          installType: e.installType as InstallType,
          buildingType: e.buildingType as BuildingType,
          environment: e.environment as WorkEnvironment,
          skillLevel: e.skillLevel as SkillLevel,
          hourlyRate: e.hourlyRate,
        },
        runInputs,
        rates,
      );

      return {
        id: e.id,
        name: e.name,
        installType: e.installType,
        buildingType: e.buildingType,
        environment: e.environment,
        skillLevel: e.skillLevel,
        hourlyRate: e.hourlyRate,
        runCount: runs.length,
        totalDrops: calc.totals.totalCables,
        totalHoursAvg: calc.totals.totalHoursAvg,
        totalCostAvg: calc.totals.totalCostAvg,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      };
    }),
  );

  res.json(summaries);
});

router.post("/estimates", async (req, res): Promise<void> => {
  const parsed = apiSchemas.CreateEstimateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(estimatesTable)
    .values({
      name: parsed.data.name,
      installType: parsed.data.installType,
      buildingType: parsed.data.buildingType,
      environment: parsed.data.environment,
      skillLevel: parsed.data.skillLevel,
      hourlyRate: parsed.data.hourlyRate,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  if (!created) {
    res.status(500).json({ error: "Failed to create estimate" });
    return;
  }

  res.status(201).json({
    id: created.id,
    name: created.name,
    installType: created.installType,
    buildingType: created.buildingType,
    environment: created.environment,
    skillLevel: created.skillLevel,
    hourlyRate: created.hourlyRate,
    notes: created.notes,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
});

router.get("/estimates/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.GetEstimateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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

  const runs = await db
    .select()
    .from(runsTable)
    .where(eq(runsTable.estimateId, estimate.id))
    .orderBy(asc(runsTable.sortOrder), asc(runsTable.id));

  const rates = await getRates();

  const runInputs: RunInput[] = runs.map((r) => ({
    id: r.id,
    label: r.label,
    cableType: r.cableType as CableType,
    numCables: r.numCables,
    lengthFt: r.lengthFt,
    ceilingType: r.ceilingType as CeilingType,
    pathwayComplexity: r.pathwayComplexity as PathwayComplexity,
  }));

  const calc = calculateEstimate(
    {
      installType: estimate.installType as InstallType,
      buildingType: estimate.buildingType as BuildingType,
      environment: estimate.environment as WorkEnvironment,
      skillLevel: estimate.skillLevel as SkillLevel,
      hourlyRate: estimate.hourlyRate,
    },
    runInputs,
    rates,
  );

  res.json({
    estimate: {
      id: estimate.id,
      name: estimate.name,
      installType: estimate.installType,
      buildingType: estimate.buildingType,
      environment: estimate.environment,
      skillLevel: estimate.skillLevel,
      hourlyRate: estimate.hourlyRate,
      notes: estimate.notes,
      createdAt: estimate.createdAt.toISOString(),
      updatedAt: estimate.updatedAt.toISOString(),
    },
    runs: calc.runs,
    totals: calc.totals,
  });
});

router.put("/estimates/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.UpdateEstimateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = apiSchemas.UpdateEstimateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(estimatesTable)
    .set({
      name: parsed.data.name,
      installType: parsed.data.installType,
      buildingType: parsed.data.buildingType,
      environment: parsed.data.environment,
      skillLevel: parsed.data.skillLevel,
      hourlyRate: parsed.data.hourlyRate,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(estimatesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Estimate not found" });
    return;
  }

  res.json({
    id: updated.id,
    name: updated.name,
    installType: updated.installType,
    buildingType: updated.buildingType,
    environment: updated.environment,
    skillLevel: updated.skillLevel,
    hourlyRate: updated.hourlyRate,
    notes: updated.notes,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

router.delete("/estimates/:id", async (req, res): Promise<void> => {
  const params = apiSchemas.DeleteEstimateParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(estimatesTable)
    .where(eq(estimatesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Estimate not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
