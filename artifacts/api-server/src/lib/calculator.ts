export type CableType =
  | "cat5e"
  | "cat6"
  | "cat6a"
  | "sm_fiber"
  | "mm_fiber"
  | "coax_rg6"
  | "coax_rg11";

export type InstallType = "new_install" | "retrofit" | "deinstall";
export type CeilingType = "open" | "drywall" | "hard_lid";
export type PathwayComplexity = "low" | "medium" | "high";
export type BuildingType = "office" | "warehouse" | "retail" | "healthcare";
export type WorkEnvironment = "occupied" | "unoccupied";
export type SkillLevel = "apprentice" | "journeyman" | "lead";

export interface RatesConfigShape {
  baseHoursPerDrop: Record<CableType, number>;
  installTypeMult: Record<InstallType, number>;
  ceilingMult: Record<CeilingType, number>;
  pathwayMult: Record<PathwayComplexity, number>;
  buildingMult: Record<BuildingType, number>;
  environmentMult: Record<WorkEnvironment, number>;
  skillMult: Record<SkillLevel, number>;
  bulkPullFactors: {
    single: number;
    small: number;
    medium: number;
    large: number;
    xlarge: number;
    xxlarge: number;
    massive: number;
  };
  pullPortionPct: number;
  lengthAdd150ft: number;
  lengthAdd250ft: number;
}

export const DEFAULT_RATES: RatesConfigShape = {
  baseHoursPerDrop: {
    cat5e: 0.75,
    cat6: 0.85,
    cat6a: 1.0,
    sm_fiber: 1.5,
    mm_fiber: 1.4,
    coax_rg6: 0.65,
    coax_rg11: 0.8,
  },
  installTypeMult: {
    new_install: 1.0,
    retrofit: 1.35,
    deinstall: 0.5,
  },
  ceilingMult: {
    open: 1.0,
    drywall: 1.2,
    hard_lid: 1.55,
  },
  pathwayMult: {
    low: 0.9,
    medium: 1.0,
    high: 1.3,
  },
  buildingMult: {
    office: 1.0,
    warehouse: 0.85,
    retail: 1.15,
    healthcare: 1.4,
  },
  environmentMult: {
    occupied: 1.2,
    unoccupied: 1.0,
  },
  skillMult: {
    apprentice: 1.35,
    journeyman: 1.0,
    lead: 0.85,
  },
  bulkPullFactors: {
    single: 1.0,
    small: 0.75,
    medium: 0.65,
    large: 0.55,
    xlarge: 0.5,
    xxlarge: 0.45,
    massive: 0.4,
  },
  pullPortionPct: 0.5,
  lengthAdd150ft: 0.15,
  lengthAdd250ft: 0.35,
};

export function bulkPullFactorFor(
  numCables: number,
  factors: RatesConfigShape["bulkPullFactors"],
): number {
  if (numCables <= 1) return factors.single;
  if (numCables === 2) return factors.small;
  if (numCables <= 4) return factors.medium;
  if (numCables <= 8) return factors.large;
  if (numCables <= 12) return factors.xlarge;
  if (numCables <= 24) return factors.xxlarge;
  return factors.massive;
}

export interface RunInput {
  id?: number;
  label: string;
  cableType: CableType;
  numCables: number;
  lengthFt: number;
  ceilingType: CeilingType;
  pathwayComplexity: PathwayComplexity;
}

export interface EstimateContext {
  installType: InstallType;
  buildingType: BuildingType;
  environment: WorkEnvironment;
  skillLevel: SkillLevel;
  hourlyRate: number;
}

export interface RunCalculation {
  runId?: number;
  label: string;
  cableType: CableType;
  numCables: number;
  lengthFt: number;
  ceilingType: CeilingType;
  pathwayComplexity: PathwayComplexity;
  baseHoursPerDrop: number;
  bulkPullFactor: number;
  adjustedHoursPerCable: number;
  runHoursLow: number;
  runHoursAvg: number;
  runHoursHigh: number;
  runCostLow: number;
  runCostAvg: number;
  runCostHigh: number;
}

const TASK_BREAKDOWN = [
  { task: "Cable Pull", percent: 0.35 },
  { task: "Termination & Testing", percent: 0.3 },
  { task: "Pathway / Conduit Work", percent: 0.15 },
  { task: "Labeling & Documentation", percent: 0.1 },
  { task: "Cleanup & Punch-list", percent: 0.1 },
];

export interface EstimateTotals {
  totalCables: number;
  totalRuns: number;
  totalHoursLow: number;
  totalHoursAvg: number;
  totalHoursHigh: number;
  totalCostLow: number;
  totalCostAvg: number;
  totalCostHigh: number;
  bulkSavingsHours: number;
  taskBreakdown: {
    task: string;
    percent: number;
    hoursAvg: number;
    costAvg: number;
  }[];
}

export interface CalculationOutput {
  runs: RunCalculation[];
  totals: EstimateTotals;
}

const round = (n: number, decimals = 2) => {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
};

export function calculateEstimate(
  ctx: EstimateContext,
  runs: RunInput[],
  rates: RatesConfigShape,
): CalculationOutput {
  const installM = rates.installTypeMult[ctx.installType];
  const buildingM = rates.buildingMult[ctx.buildingType];
  const envM = rates.environmentMult[ctx.environment];
  const skillM = rates.skillMult[ctx.skillLevel];

  const calcs: RunCalculation[] = [];
  let totalCablesPulledIndividuallyHours = 0;
  let totalCablesActualHoursAvg = 0;

  for (const run of runs) {
    const base = rates.baseHoursPerDrop[run.cableType];
    const ceilingM = rates.ceilingMult[run.ceilingType];
    const pathM = rates.pathwayMult[run.pathwayComplexity];

    let lengthAdd = 0;
    if (run.lengthFt > 250) lengthAdd = rates.lengthAdd250ft;
    else if (run.lengthFt > 150) lengthAdd = rates.lengthAdd150ft;

    const conditionMultiplier =
      installM * ceilingM * pathM * buildingM * envM * skillM;

    const adjustedBase = base * conditionMultiplier + lengthAdd;
    const bulkFactor = bulkPullFactorFor(run.numCables, rates.bulkPullFactors);

    const pullPortion = adjustedBase * rates.pullPortionPct * bulkFactor;
    const fixedPortion = adjustedBase * (1 - rates.pullPortionPct);
    const adjustedHoursPerCable = pullPortion + fixedPortion;

    const runHoursAvg = adjustedHoursPerCable * run.numCables;
    const runHoursLow = runHoursAvg * 0.85;
    const runHoursHigh = runHoursAvg * 1.2;

    const runCostAvg = runHoursAvg * ctx.hourlyRate;
    const runCostLow = runHoursLow * ctx.hourlyRate;
    const runCostHigh = runHoursHigh * ctx.hourlyRate;

    totalCablesPulledIndividuallyHours += adjustedBase * run.numCables;
    totalCablesActualHoursAvg += runHoursAvg;

    calcs.push({
      runId: run.id,
      label: run.label,
      cableType: run.cableType,
      numCables: run.numCables,
      lengthFt: run.lengthFt,
      ceilingType: run.ceilingType,
      pathwayComplexity: run.pathwayComplexity,
      baseHoursPerDrop: round(base, 3),
      bulkPullFactor: round(bulkFactor, 3),
      adjustedHoursPerCable: round(adjustedHoursPerCable, 3),
      runHoursLow: round(runHoursLow, 2),
      runHoursAvg: round(runHoursAvg, 2),
      runHoursHigh: round(runHoursHigh, 2),
      runCostLow: round(runCostLow, 2),
      runCostAvg: round(runCostAvg, 2),
      runCostHigh: round(runCostHigh, 2),
    });
  }

  const totalHoursAvg = totalCablesActualHoursAvg;
  const totalHoursLow = totalHoursAvg * 0.85;
  const totalHoursHigh = totalHoursAvg * 1.2;

  const totalCostAvg = totalHoursAvg * ctx.hourlyRate;
  const totalCostLow = totalHoursLow * ctx.hourlyRate;
  const totalCostHigh = totalHoursHigh * ctx.hourlyRate;

  const totalCables = runs.reduce((sum, r) => sum + r.numCables, 0);
  const bulkSavings = Math.max(
    0,
    totalCablesPulledIndividuallyHours - totalCablesActualHoursAvg,
  );

  const taskBreakdown = TASK_BREAKDOWN.map((t) => ({
    task: t.task,
    percent: t.percent,
    hoursAvg: round(totalHoursAvg * t.percent, 2),
    costAvg: round(totalCostAvg * t.percent, 2),
  }));

  return {
    runs: calcs,
    totals: {
      totalCables,
      totalRuns: runs.length,
      totalHoursLow: round(totalHoursLow, 2),
      totalHoursAvg: round(totalHoursAvg, 2),
      totalHoursHigh: round(totalHoursHigh, 2),
      totalCostLow: round(totalCostLow, 2),
      totalCostAvg: round(totalCostAvg, 2),
      totalCostHigh: round(totalCostHigh, 2),
      bulkSavingsHours: round(bulkSavings, 2),
      taskBreakdown,
    },
  };
}
