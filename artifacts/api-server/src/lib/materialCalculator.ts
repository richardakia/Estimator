import type { RatesConfigShape } from "./calculator";

export interface MaterialRunInput {
  cableType: string;
  numCables: number;
  fiberStrands?: number;
  lengthFt: number;
}

export interface MaterialHardwareInput {
  quantity: number;
  unitCost: number;
}

export interface MaterialCableLine {
  cableType: string;
  totalLengthFt: number;
  totalCables: number;
  costPerFt: number;
  subtotal: number;
}

export interface MaterialTerminationLine {
  cableType: string;
  totalEnds: number;
  costPerEnd: number;
  subtotal: number;
}

export interface MaterialBreakdown {
  cableSubtotal: number;
  cableWasteAmount: number;
  terminationSubtotal: number;
  pathwaySubtotal: number;
  hardwareSubtotal: number;
  subtotal: number;
  wastePercent: number;
  markupPercent: number;
  markupAmount: number;
  total: number;
  cableLines: MaterialCableLine[];
  terminationLines: MaterialTerminationLine[];
}

export const TERMINATIONS_PER_CABLE = 2;

const round = (n: number, decimals = 2) => {
  const f = Math.pow(10, decimals);
  return Math.round(n * f) / f;
};

export interface ComputeMaterialsArgs {
  runs?: MaterialRunInput[];
  hardware: MaterialHardwareInput[];
  pathwaySubtotal?: number;
  rates: RatesConfigShape;
}

export function computeMaterials({
  runs = [],
  hardware,
  pathwaySubtotal = 0,
  rates,
}: ComputeMaterialsArgs): MaterialBreakdown {
  const cableRates = (rates.cableMaterialCostPerFt ?? {}) as Record<string, number>;
  const termRates = (rates.terminationHardwareCostPerEnd ?? {}) as Record<string, number>;
  const wastePercent = Math.max(0, rates.materialWastePercent ?? 0);
  const markupPercent = Math.max(0, rates.materialMarkupPercent ?? 0);

  // Aggregate runs by cable type for cable + termination subtotals
  const cableAgg = new Map<string, { totalLengthFt: number; totalCables: number }>();
  const termAgg = new Map<string, { totalEnds: number }>();
  for (const r of runs) {
    const lengthFt = Math.max(0, r.lengthFt) * Math.max(0, r.numCables);
    const c = cableAgg.get(r.cableType) ?? { totalLengthFt: 0, totalCables: 0 };
    c.totalLengthFt += lengthFt;
    c.totalCables += r.numCables;
    cableAgg.set(r.cableType, c);

    // Terminations: each cable has 2 ends. For fiber, each strand is a separate termination.
    const strands = Math.max(1, r.fiberStrands ?? 1);
    const ends = r.numCables * TERMINATIONS_PER_CABLE * strands;
    const t = termAgg.get(r.cableType) ?? { totalEnds: 0 };
    t.totalEnds += ends;
    termAgg.set(r.cableType, t);
  }

  const cableLines: MaterialCableLine[] = [];
  let cableSubtotal = 0;
  for (const [cableType, agg] of cableAgg) {
    const costPerFt = cableRates[cableType] ?? 0;
    const subtotal = agg.totalLengthFt * costPerFt;
    cableSubtotal += subtotal;
    cableLines.push({
      cableType,
      totalLengthFt: round(agg.totalLengthFt, 2),
      totalCables: agg.totalCables,
      costPerFt: round(costPerFt, 4),
      subtotal: round(subtotal, 2),
    });
  }
  cableLines.sort((a, b) => a.cableType.localeCompare(b.cableType));

  const terminationLines: MaterialTerminationLine[] = [];
  let terminationSubtotal = 0;
  for (const [cableType, agg] of termAgg) {
    const costPerEnd = termRates[cableType] ?? 0;
    const subtotal = agg.totalEnds * costPerEnd;
    terminationSubtotal += subtotal;
    terminationLines.push({
      cableType,
      totalEnds: agg.totalEnds,
      costPerEnd: round(costPerEnd, 4),
      subtotal: round(subtotal, 2),
    });
  }
  terminationLines.sort((a, b) => a.cableType.localeCompare(b.cableType));

  const cableWasteAmount = cableSubtotal * (wastePercent / 100);
  const hardwareSubtotal = hardware.reduce(
    (sum, h) => sum + Math.max(0, h.quantity) * Math.max(0, h.unitCost),
    0,
  );
  const subtotal =
    cableSubtotal + cableWasteAmount + terminationSubtotal + pathwaySubtotal + hardwareSubtotal;
  const markupAmount = subtotal * (markupPercent / 100);
  const total = subtotal + markupAmount;

  return {
    cableSubtotal: round(cableSubtotal, 2),
    cableWasteAmount: round(cableWasteAmount, 2),
    terminationSubtotal: round(terminationSubtotal, 2),
    pathwaySubtotal: round(pathwaySubtotal, 2),
    hardwareSubtotal: round(hardwareSubtotal, 2),
    subtotal: round(subtotal, 2),
    wastePercent: round(wastePercent, 2),
    markupPercent: round(markupPercent, 2),
    markupAmount: round(markupAmount, 2),
    total: round(total, 2),
    cableLines,
    terminationLines,
  };
}
