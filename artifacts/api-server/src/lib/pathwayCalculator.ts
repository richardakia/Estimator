// Server-side mirror of the pathway calculation logic in
// artifacts/cable-estimator/src/lib/pathwayConfig.ts. Kept separate so the
// server can compute totals + per-segment breakdowns for saved pathway
// estimates without depending on the frontend bundle.

import type { RatesConfigShape } from "./calculator";

export interface PathwayTypeRateValues {
  laborMinPerFt: number;
  materialCostPerFt: number;
  fastenerSpacingFt: number;
  fastenerCostEach: number;
  fastenerLaborMinEach: number;
}

export interface CableFillMultValues {
  laborMult: number;
  materialMult: number;
}

export interface PathwayRates {
  typeRates: Record<string, PathwayTypeRateValues>;
  heightMult: Record<string, number>;
  ceilingMult: Record<string, number>;
  fillMult: Record<string, CableFillMultValues>;
  bendLaborHrs: number;
  bendMaterialCost: number;
  penetrationLaborHrs: number;
  penetrationMaterialCost: number;
}

export const DEFAULT_PATHWAY_TYPE_RATES: Record<string, PathwayTypeRateValues> = {
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
};

// Pathway types that are estimated per-each (sleeves) instead of per linear ft.
export const PER_EACH_PATHWAY_TYPES = new Set<string>(["sleeves"]);

export const DEFAULT_PATHWAY_RATES: PathwayRates = {
  typeRates: DEFAULT_PATHWAY_TYPE_RATES,
  heightMult: { "8ft": 1.0, "12ft": 1.15, "16ft": 1.3, "20ft": 1.5 },
  ceilingMult: { open_deck: 1.0, t_bar: 1.1, drywall: 1.25, concrete: 1.35 },
  fillMult: {
    light: { laborMult: 0.95, materialMult: 1.0 },
    medium: { laborMult: 1.0, materialMult: 1.1 },
    heavy: { laborMult: 1.1, materialMult: 1.3 },
    critical: { laborMult: 1.2, materialMult: 1.6 },
  },
  bendLaborHrs: 0.5,
  bendMaterialCost: 35,
  penetrationLaborHrs: 0.75,
  penetrationMaterialCost: 50,
};

/**
 * Project the pathway-related fields out of the persisted RatesConfig and
 * fill in any missing keys from defaults so the calculator always sees a
 * complete table.
 */
export function resolvePathwayRatesFromConfig(rates: RatesConfigShape): PathwayRates {
  const r = rates as RatesConfigShape & {
    pathwayTypeRates?: Record<string, PathwayTypeRateValues>;
    pathwayMountingHeightMult?: Record<string, number>;
    pathwayCeilingMult?: Record<string, number>;
    pathwayCableFillMult?: Record<string, CableFillMultValues>;
    pathwayBendLaborHrs?: number;
    pathwayBendMaterialCost?: number;
    pathwayPenetrationLaborHrs?: number;
    pathwayPenetrationMaterialCost?: number;
  };
  return {
    typeRates: { ...DEFAULT_PATHWAY_RATES.typeRates, ...(r.pathwayTypeRates ?? {}) },
    heightMult: { ...DEFAULT_PATHWAY_RATES.heightMult, ...(r.pathwayMountingHeightMult ?? {}) },
    ceilingMult: { ...DEFAULT_PATHWAY_RATES.ceilingMult, ...(r.pathwayCeilingMult ?? {}) },
    fillMult: { ...DEFAULT_PATHWAY_RATES.fillMult, ...(r.pathwayCableFillMult ?? {}) },
    bendLaborHrs: r.pathwayBendLaborHrs ?? DEFAULT_PATHWAY_RATES.bendLaborHrs,
    bendMaterialCost: r.pathwayBendMaterialCost ?? DEFAULT_PATHWAY_RATES.bendMaterialCost,
    penetrationLaborHrs:
      r.pathwayPenetrationLaborHrs ?? DEFAULT_PATHWAY_RATES.penetrationLaborHrs,
    penetrationMaterialCost:
      r.pathwayPenetrationMaterialCost ?? DEFAULT_PATHWAY_RATES.penetrationMaterialCost,
  };
}

export interface PathwaySegmentInput {
  pathwayType: string;
  lengthFt: number;
  mountingHeight: string;
  ceilingType: string;
  cableFill: string;
  bends: number;
  penetrations: number;
}

export interface PathwaySegmentResult {
  baseLaborHrs: number;
  fastenerCount: number;
  fastenerLaborHrs: number;
  bendLaborHrs: number;
  penetrationLaborHrs: number;
  totalLaborHrs: number;
  pathwayMaterialCost: number;
  fastenerMaterialCost: number;
  bendMaterialCost: number;
  penetrationMaterialCost: number;
  totalMaterialCost: number;
  laborCost: number;
  totalCost: number;
  perFtCost: number;
}

const EMPTY_RESULT: PathwaySegmentResult = {
  baseLaborHrs: 0,
  fastenerCount: 0,
  fastenerLaborHrs: 0,
  bendLaborHrs: 0,
  penetrationLaborHrs: 0,
  totalLaborHrs: 0,
  pathwayMaterialCost: 0,
  fastenerMaterialCost: 0,
  bendMaterialCost: 0,
  penetrationMaterialCost: 0,
  totalMaterialCost: 0,
  laborCost: 0,
  totalCost: 0,
  perFtCost: 0,
};

export interface PathwayContextMultipliers {
  installMult: number;
  buildingMult: number;
  environmentMult: number;
  skillMult: number;
}

export function resolvePathwayContextMultipliers(
  rates: RatesConfigShape,
  ctx: {
    installType: string;
    buildingType: string;
    environment: string;
    skillLevel: string;
  },
): PathwayContextMultipliers {
  return {
    installMult:
      (rates.installTypeMult as Record<string, number>)[ctx.installType] ?? 1,
    buildingMult:
      (rates.buildingMult as Record<string, number>)[ctx.buildingType] ?? 1,
    environmentMult:
      (rates.environmentMult as Record<string, number>)[ctx.environment] ?? 1,
    skillMult:
      (rates.skillMult as Record<string, number>)[ctx.skillLevel] ?? 1,
  };
}

export function calculatePathwaySegment(
  segment: PathwaySegmentInput,
  hourlyRate: number,
  rates: PathwayRates,
  contextMult: PathwayContextMultipliers = {
    installMult: 1,
    buildingMult: 1,
    environmentMult: 1,
    skillMult: 1,
  },
): PathwaySegmentResult {
  const typeRate = rates.typeRates[segment.pathwayType];
  const heightMult = rates.heightMult[segment.mountingHeight];
  if (!typeRate || heightMult === undefined) return EMPTY_RESULT;

  const ctxMult =
    contextMult.installMult *
    contextMult.buildingMult *
    contextMult.environmentMult *
    contextMult.skillMult;

  const length = Math.max(0, segment.lengthFt);
  const isPerEach = PER_EACH_PATHWAY_TYPES.has(segment.pathwayType);

  if (isPerEach) {
    const baseLaborHrs =
      ((typeRate.laborMinPerFt * length) / 60) * heightMult * ctxMult;
    const pathwayMaterialCost = typeRate.materialCostPerFt * length;
    const totalLaborHrs = baseLaborHrs;
    const totalMaterialCost = pathwayMaterialCost;
    const laborCost = totalLaborHrs * hourlyRate;
    const totalCost = laborCost + totalMaterialCost;
    return {
      baseLaborHrs,
      fastenerCount: 0,
      fastenerLaborHrs: 0,
      bendLaborHrs: 0,
      penetrationLaborHrs: 0,
      totalLaborHrs,
      pathwayMaterialCost,
      fastenerMaterialCost: 0,
      bendMaterialCost: 0,
      penetrationMaterialCost: 0,
      totalMaterialCost,
      laborCost,
      totalCost,
      perFtCost: length > 0 ? totalCost / length : 0,
    };
  }

  const ceilingMult = rates.ceilingMult[segment.ceilingType] ?? 1;
  const fill = rates.fillMult[segment.cableFill];
  const fillLaborMult = fill?.laborMult ?? 1;
  const fillMaterialMult = fill?.materialMult ?? 1;

  const baseLaborHrs =
    ((typeRate.laborMinPerFt * length) / 60) *
    heightMult *
    ceilingMult *
    fillLaborMult *
    ctxMult;

  const fastenerCount =
    typeRate.fastenerSpacingFt > 0 && length > 0
      ? Math.ceil(length / typeRate.fastenerSpacingFt)
      : 0;
  const fastenerLaborHrs =
    ((fastenerCount * typeRate.fastenerLaborMinEach) / 60) * heightMult * ctxMult;

  const bendLaborHrs =
    segment.bends * rates.bendLaborHrs * heightMult * ctxMult;
  const penetrationLaborHrs =
    segment.penetrations * rates.penetrationLaborHrs * ctxMult;

  const totalLaborHrs =
    baseLaborHrs + fastenerLaborHrs + bendLaborHrs + penetrationLaborHrs;

  const pathwayMaterialCost = typeRate.materialCostPerFt * length * fillMaterialMult;
  const fastenerMaterialCost = fastenerCount * typeRate.fastenerCostEach;
  const bendMaterialCost = segment.bends * rates.bendMaterialCost;
  const penetrationMaterialCost = segment.penetrations * rates.penetrationMaterialCost;

  const totalMaterialCost =
    pathwayMaterialCost + fastenerMaterialCost + bendMaterialCost + penetrationMaterialCost;

  const laborCost = totalLaborHrs * hourlyRate;
  const totalCost = laborCost + totalMaterialCost;

  return {
    baseLaborHrs,
    fastenerCount,
    fastenerLaborHrs,
    bendLaborHrs,
    penetrationLaborHrs,
    totalLaborHrs,
    pathwayMaterialCost,
    fastenerMaterialCost,
    bendMaterialCost,
    penetrationMaterialCost,
    totalMaterialCost,
    laborCost,
    totalCost,
    perFtCost: length > 0 ? totalCost / length : 0,
  };
}
