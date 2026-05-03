export type CableType =
  | "category"
  | "fiber"
  | "coax"
  | "speaker_cable";

export type InstallType = "new_install" | "retrofit" | "deinstall";
export type CeilingType = "open" | "drywall" | "hard_lid";
export type PathwayComplexity = "low" | "medium" | "high";
export type BuildingType = "office" | "warehouse" | "retail" | "healthcare";
export type WorkEnvironment = "occupied" | "unoccupied";
export type SkillLevel = "apprentice" | "journeyman" | "lead";

export const TERMINATIONS_PER_CABLE = 2;

export interface CustomCableType {
  value: string;
  label: string;
}

export interface PathwayTypeRate {
  laborMinPerFt: number;
  materialCostPerFt: number;
  fastenerSpacingFt: number;
  fastenerCostEach: number;
  fastenerLaborMinEach: number;
}

export interface PathwayCableFillMult {
  laborMult: number;
  materialMult: number;
}

export interface RatesConfigShape {
  hourlyRate?: number;
  /** Sensitivity (α) of the bulk-pull difficulty curve: bulkFactor = 1 + α × ln(numCables). Default 0.15. */
  bulkFactorAlpha?: number;
  customCableTypes?: CustomCableType[];
  pullMinutesPer10Ft: Record<string, number>;
  terminationMinutesPerEnd: Record<string, number>;
  installTypeMult: Record<InstallType, number>;
  ceilingMult: Record<CeilingType, number>;
  pathwayMult: Record<PathwayComplexity, number>;
  buildingMult: Record<BuildingType, number>;
  environmentMult: Record<WorkEnvironment, number>;
  skillMult: Record<SkillLevel, number>;
  pathwayTypeRates?: Record<string, PathwayTypeRate>;
  pathwayMountingHeightMult?: Record<string, number>;
  pathwayCeilingMult?: Record<string, number>;
  pathwayCableFillMult?: Record<string, PathwayCableFillMult>;
  pathwayBendLaborHrs?: number;
  pathwayBendMaterialCost?: number;
  pathwayPenetrationLaborHrs?: number;
  pathwayPenetrationMaterialCost?: number;
}

export const DEFAULT_RATES: RatesConfigShape = {
  customCableTypes: [],
  pullMinutesPer10Ft: {
    category: 3.0,
    fiber: 4.0,
    coax: 3.0,
    speaker_cable: 2.0,
  },
  terminationMinutesPerEnd: {
    category: 5,
    fiber: 13,
    coax: 4.5,
    speaker_cable: 3,
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
  hourlyRate: 85,
  bulkFactorAlpha: 0.15,
  pathwayTypeRates: {
    cable_tray: { laborMinPerFt: 12, materialCostPerFt: 14, fastenerSpacingFt: 5, fastenerCostEach: 22, fastenerLaborMinEach: 12 },
    wire_basket: { laborMinPerFt: 8, materialCostPerFt: 8, fastenerSpacingFt: 4, fastenerCostEach: 14, fastenerLaborMinEach: 8 },
    solid_tray: { laborMinPerFt: 14, materialCostPerFt: 18, fastenerSpacingFt: 5, fastenerCostEach: 22, fastenerLaborMinEach: 12 },
    j_hooks: { laborMinPerFt: 3, materialCostPerFt: 2.5, fastenerSpacingFt: 4, fastenerCostEach: 4.5, fastenerLaborMinEach: 2 },
    d_rings: { laborMinPerFt: 2.5, materialCostPerFt: 1.5, fastenerSpacingFt: 4, fastenerCostEach: 2.75, fastenerLaborMinEach: 1.5 },
    arlington_loops: { laborMinPerFt: 2.8, materialCostPerFt: 2, fastenerSpacingFt: 4, fastenerCostEach: 3.5, fastenerLaborMinEach: 2 },
    emt_conduit: { laborMinPerFt: 10, materialCostPerFt: 4, fastenerSpacingFt: 8, fastenerCostEach: 3, fastenerLaborMinEach: 4 },
    pvc_conduit: { laborMinPerFt: 8, materialCostPerFt: 3, fastenerSpacingFt: 8, fastenerCostEach: 2.5, fastenerLaborMinEach: 3 },
    sleeves: { laborMinPerFt: 25, materialCostPerFt: 45, fastenerSpacingFt: 0, fastenerCostEach: 0, fastenerLaborMinEach: 0 },
    unistrut_rod: { laborMinPerFt: 6, materialCostPerFt: 12, fastenerSpacingFt: 5, fastenerCostEach: 6, fastenerLaborMinEach: 5 },
  },
  pathwayMountingHeightMult: {
    "8ft": 1.0,
    "12ft": 1.15,
    "16ft": 1.3,
    "20ft": 1.5,
  },
  pathwayCeilingMult: {
    open_deck: 1.0,
    t_bar: 1.1,
    drywall: 1.25,
    concrete: 1.35,
  },
  pathwayCableFillMult: {
    light: { laborMult: 0.95, materialMult: 1.0 },
    medium: { laborMult: 1.0, materialMult: 1.1 },
    heavy: { laborMult: 1.1, materialMult: 1.3 },
    critical: { laborMult: 1.2, materialMult: 1.6 },
  },
  pathwayBendLaborHrs: 0.5,
  pathwayBendMaterialCost: 35,
  pathwayPenetrationLaborHrs: 0.75,
  pathwayPenetrationMaterialCost: 50,
};

export const DEFAULT_BULK_FACTOR_ALPHA = 0.15;

/**
 * Computes the bulk pull *difficulty* factor for a given bulk pull size B.
 * Pulling more cables together is HARDER (friction, weight, jamming), so the
 * factor grows with B using a logarithmic curve with diminishing marginal
 * difficulty:
 *
 *   bulkFactor = 1 + α × ln(B)
 *
 *   B = 1  → 1.000  (baseline — no penalty)
 *   B = 6  → 1 + α×1.792
 *   B = 12 → 1 + α×2.485
 *   B = 24 → 1 + α×3.178
 *
 * α (alpha) is the sensitivity factor (default 0.15). Larger α = steeper
 * penalty for adding cables to the same pull.
 */
export function bulkFactorFor(
  bulkSize: number,
  alpha: number = DEFAULT_BULK_FACTOR_ALPHA,
): number {
  const b = Math.max(1, Math.round(bulkSize));
  const a = Math.max(0, alpha);
  return 1 + a * Math.log(b);
}

export interface RunInput {
  id?: number;
  label: string;
  cableType: string;
  /** Number of cables pulled simultaneously in this run — used as B in bulkFactor = 1 + α × ln(numCables) */
  numCables: number;
  /** Strands per fiber cable; each strand is terminated separately. Defaults to 1 for non-fiber. */
  fiberStrands?: number;
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
  cableType: string;
  /** Cables pulled simultaneously (B) — same as numCables in RunInput */
  numCables: number;
  /** Strands per fiber cable; multiplies termination labor (1 for non-fiber) */
  fiberStrands: number;
  lengthFt: number;
  ceilingType: CeilingType;
  pathwayComplexity: PathwayComplexity;
  /** Computed: 1 + α × ln(numCables). Values > 1 mean a per-cable difficulty penalty. */
  bulkFactor: number;
  pullMinutesPer10Ft: number;
  terminationMinutesPerEnd: number;
  /** Combined site/condition multiplier: install × ceiling × pathway × building × environment × skill */
  conditionMultiplier: number;
  /** Pull hours for one cable within a single bulk pass (after condition mult + bulk factor) */
  pullHoursPerCable: number;
  /** Termination hours per cable (both ends, after condition mult — NOT bulk-discounted) */
  terminationHoursPerCable: number;
  /** Average hours per cable = (totalPullHours + totalTermHours) / numCables */
  adjustedHoursPerCable: number;
  runHoursLow: number;
  runHoursAvg: number;
  runHoursHigh: number;
  runCostLow: number;
  runCostAvg: number;
  runCostHigh: number;
}


export interface EstimateTotals {
  totalCables: number;
  totalRuns: number;
  totalHoursLow: number;
  totalHoursAvg: number;
  totalHoursHigh: number;
  totalCostLow: number;
  totalCostAvg: number;
  totalCostHigh: number;
  /** Hours saved by pulling cables in a single bulk pass vs. pulling each one solo (≥ 0). */
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
  let totalCablesSoloHours = 0;
  let totalCablesActualHoursAvg = 0;
  let totalPullHoursAcrossRuns = 0;
  let totalTermHoursAcrossRuns = 0;
  const alpha = rates.bulkFactorAlpha ?? DEFAULT_BULK_FACTOR_ALPHA;

  for (const run of runs) {
    const pullMin = rates.pullMinutesPer10Ft[run.cableType] ?? 3.0;
    const termMin = rates.terminationMinutesPerEnd[run.cableType] ?? 5;
    const ceilingM = rates.ceilingMult[run.ceilingType];
    const pathM = rates.pathwayMult[run.pathwayComplexity];
    const conditionMultiplier = installM * ceilingM * pathM * buildingM * envM * skillM;

    const N = run.numCables;
    const strands = Math.max(1, run.fiberStrands ?? 1);

    // ── Pull calculation (logarithmic bulk-difficulty formula) ───────────
    // numCables IS the bulk pull size B for this run.
    // bulkFactor = 1 + α × ln(N) — the difficulty premium for a single
    // bulk pass of N cables together (friction, weight, jamming).
    // The crew makes ONE pass for the whole bundle, so total pull time
    // does NOT multiply by N — the bulk factor already accounts for the
    // cable count's contribution to that one pass.
    const rawPullHoursPerPass = (pullMin / 60) * (run.lengthFt / 10);
    const bulkFactor = bulkFactorFor(N, alpha);
    const totalPullHours = rawPullHoursPerPass * conditionMultiplier * bulkFactor;
    // Average pull hours attributed to each cable in the bundle.
    const pullHoursPerCable = N > 0 ? totalPullHours / N : 0;

    // ── Termination calculation (bulk does NOT reduce termination) ───────
    // For fiber, each strand is terminated separately, so termination labor
    // scales with strand count. Non-fiber cables use strands = 1.
    const rawTermHoursPerCable = (termMin * TERMINATIONS_PER_CABLE * strands) / 60;
    const terminationHoursPerCable = rawTermHoursPerCable * conditionMultiplier;
    const totalTermHours = terminationHoursPerCable * N;

    // ── Run totals ────────────────────────────────────────────────────────
    const runHoursAvg = totalPullHours + totalTermHours;
    const adjustedHoursPerCable = runHoursAvg / N;

    const runHoursLow = runHoursAvg * 0.85;
    const runHoursHigh = runHoursAvg * 1.2;

    const runCostAvg = runHoursAvg * ctx.hourlyRate;
    const runCostLow = runHoursLow * ctx.hourlyRate;
    const runCostHigh = runHoursHigh * ctx.hourlyRate;

    // ── Bulk-savings comparison (what if every cable pulled solo) ────────
    // Solo: N independent passes, each = rawPullHoursPerPass × conditionMult.
    // Termination is the same either way.
    const soloRunHours =
      rawPullHoursPerPass * conditionMultiplier * N + terminationHoursPerCable * N;
    totalCablesSoloHours += soloRunHours;
    totalCablesActualHoursAvg += runHoursAvg;
    totalPullHoursAcrossRuns += totalPullHours;
    totalTermHoursAcrossRuns += totalTermHours;

    calcs.push({
      runId: run.id,
      label: run.label,
      cableType: run.cableType,
      numCables: N,
      fiberStrands: strands,
      lengthFt: run.lengthFt,
      ceilingType: run.ceilingType,
      pathwayComplexity: run.pathwayComplexity,
      bulkFactor: round(bulkFactor, 4),
      pullMinutesPer10Ft: round(pullMin, 3),
      terminationMinutesPerEnd: round(termMin, 3),
      conditionMultiplier: round(conditionMultiplier, 4),
      pullHoursPerCable: round(pullHoursPerCable, 4),
      terminationHoursPerCable: round(terminationHoursPerCable, 4),
      adjustedHoursPerCable: round(adjustedHoursPerCable, 4),
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
  // One bulk pass with mild difficulty premium is much faster than N solo
  // passes, so solo ≥ actual. Savings = time avoided.
  const bulkSavings = Math.max(0, totalCablesSoloHours - totalCablesActualHoursAvg);

  const pullPercent =
    totalHoursAvg > 0 ? totalPullHoursAcrossRuns / totalHoursAvg : 0;
  const termPercent =
    totalHoursAvg > 0 ? totalTermHoursAcrossRuns / totalHoursAvg : 0;

  const taskBreakdown = [
    {
      task: "Cable Pull",
      percent: round(pullPercent, 4),
      hoursAvg: round(totalPullHoursAcrossRuns, 2),
      costAvg: round(totalPullHoursAcrossRuns * ctx.hourlyRate, 2),
    },
    {
      task: "Termination & Testing",
      percent: round(termPercent, 4),
      hoursAvg: round(totalTermHoursAcrossRuns, 2),
      costAvg: round(totalTermHoursAcrossRuns * ctx.hourlyRate, 2),
    },
  ];

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
