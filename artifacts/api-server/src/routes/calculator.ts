import { Router, type IRouter } from "express";
import { apiSchemas } from "@workspace/api-zod";
import { calculateEstimate } from "../lib/calculator";
import type {
  RunInput,
  CableType,
  CeilingType,
  PathwayComplexity,
  InstallType,
  BuildingType,
  WorkEnvironment,
  SkillLevel,
} from "../lib/calculator";
import { getRates } from "../lib/ratesStore";

const router: IRouter = Router();

router.post("/calculator/preview", async (req, res): Promise<void> => {
  const parsed = apiSchemas.PreviewCalculationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rates = await getRates();

  const runInputs: RunInput[] = parsed.data.runs.map((r) => ({
    label: r.label,
    cableType: r.cableType as CableType,
    numCables: r.numCables,
    lengthFt: r.lengthFt,
    ceilingType: r.ceilingType as CeilingType,
    pathwayComplexity: r.pathwayComplexity as PathwayComplexity,
  }));

  const calc = calculateEstimate(
    {
      installType: parsed.data.installType as InstallType,
      buildingType: parsed.data.buildingType as BuildingType,
      environment: parsed.data.environment as WorkEnvironment,
      skillLevel: parsed.data.skillLevel as SkillLevel,
      hourlyRate: parsed.data.hourlyRate,
    },
    runInputs,
    rates,
  );

  res.json(calc);
});

export default router;
