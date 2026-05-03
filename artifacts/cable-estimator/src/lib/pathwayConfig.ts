export type PathwayCategory =
  | "continuous"
  | "non_continuous"
  | "enclosed"
  | "fastening";

export interface PathwayType {
  value: string;
  label: string;
  category: PathwayCategory;
  laborMinPerFt: number;
  materialCostPerFt: number;
  fastenerSpacingFt: number;
  fastenerCostEach: number;
  fastenerLaborMinEach: number;
  bestFor: string;
  perEach?: boolean;
}

export const PATHWAY_TYPES: PathwayType[] = [
  {
    value: "cable_tray",
    label: "Cable Tray / Ladder Rack",
    category: "continuous",
    laborMinPerFt: 12,
    materialCostPerFt: 14,
    fastenerSpacingFt: 5,
    fastenerCostEach: 22,
    fastenerLaborMinEach: 12,
    bestFor: "High-volume data centers, large trunk lines, backbone pathways",
  },
  {
    value: "wire_basket",
    label: "Wire Basket / Mesh Tray",
    category: "continuous",
    laborMinPerFt: 8,
    materialCostPerFt: 8,
    fastenerSpacingFt: 4,
    fastenerCostEach: 14,
    fastenerLaborMinEach: 8,
    bestFor: "New construction and office ceilings; general horizontal distribution",
  },
  {
    value: "solid_tray",
    label: "Perforated / Solid-Bottom Tray",
    category: "continuous",
    laborMinPerFt: 14,
    materialCostPerFt: 18,
    fastenerSpacingFt: 5,
    fastenerCostEach: 22,
    fastenerLaborMinEach: 12,
    bestFor: "Industrial or outdoor areas needing dust or moisture protection",
  },
  {
    value: "j_hooks",
    label: "J-Hooks",
    category: "non_continuous",
    laborMinPerFt: 3,
    materialCostPerFt: 2.5,
    fastenerSpacingFt: 4,
    fastenerCostEach: 4.5,
    fastenerLaborMinEach: 2,
    bestFor: "Standard horizontal runs; open ceilings, retrofits, moderate-density bundles",
  },
  {
    value: "d_rings",
    label: "D-Rings / Bridle Rings",
    category: "non_continuous",
    laborMinPerFt: 2.5,
    materialCostPerFt: 1.5,
    fastenerSpacingFt: 4,
    fastenerCostEach: 2.75,
    fastenerLaborMinEach: 1.5,
    bestFor: "Lightweight category or AV runs; not for heavy bundles or fiber",
  },
  {
    value: "arlington_loops",
    label: "Arlington Loops",
    category: "non_continuous",
    laborMinPerFt: 2.8,
    materialCostPerFt: 2,
    fastenerSpacingFt: 4,
    fastenerCostEach: 3.5,
    fastenerLaborMinEach: 2,
    bestFor: "Low-to-moderate density; clean alternative where J-hooks are impractical",
  },
  {
    value: "emt_conduit",
    label: "EMT Conduit",
    category: "enclosed",
    laborMinPerFt: 10,
    materialCostPerFt: 4,
    fastenerSpacingFt: 8,
    fastenerCostEach: 3,
    fastenerLaborMinEach: 4,
    bestFor: "Exposed indoor runs, mechanical rooms, code-required enclosed pathways",
  },
  {
    value: "pvc_conduit",
    label: "PVC Conduit",
    category: "enclosed",
    laborMinPerFt: 8,
    materialCostPerFt: 3,
    fastenerSpacingFt: 8,
    fastenerCostEach: 2.5,
    fastenerLaborMinEach: 3,
    bestFor: "Outdoor, underground, and corrosive environments",
  },
  {
    value: "sleeves",
    label: "Sleeves & Slots (per penetration)",
    category: "enclosed",
    laborMinPerFt: 25,
    materialCostPerFt: 45,
    fastenerSpacingFt: 0,
    fastenerCostEach: 0,
    fastenerLaborMinEach: 0,
    bestFor: "Passing cables between rooms or floors through fire-rated barriers",
    perEach: true,
  },
  {
    value: "unistrut_rod",
    label: "Unistrut + All-Thread Rod (support grid)",
    category: "fastening",
    laborMinPerFt: 6,
    materialCostPerFt: 12,
    fastenerSpacingFt: 5,
    fastenerCostEach: 6,
    fastenerLaborMinEach: 5,
    bestFor: "Mounting grid for trays / J-hooks; secure attachment to deck or beams",
  },
];

export const PATHWAY_CATEGORIES: { value: PathwayCategory; label: string }[] = [
  { value: "continuous", label: "Continuous Support" },
  { value: "non_continuous", label: "Non-Continuous Support" },
  { value: "enclosed", label: "Enclosed / Protected Pathways" },
  { value: "fastening", label: "Fastening Systems" },
];

export const MOUNTING_HEIGHTS = [
  { value: "8ft", label: "≤ 8 ft (ladder)", multiplier: 1.0 },
  { value: "12ft", label: "9–12 ft (tall ladder)", multiplier: 1.15 },
  { value: "16ft", label: "13–16 ft (lift required)", multiplier: 1.3 },
  { value: "20ft", label: "17 ft+ (scissor / boom lift)", multiplier: 1.5 },
] as const;

export const PATHWAY_CEILING_TYPES = [
  { value: "open_deck", label: "Open Deck / Bar Joist", multiplier: 1.0 },
  { value: "t_bar", label: "Drop Ceiling / T-bar", multiplier: 1.1 },
  { value: "drywall", label: "Drywall / Hard Lid", multiplier: 1.25 },
  { value: "concrete", label: "Concrete (anchors required)", multiplier: 1.35 },
] as const;

export const CABLE_FILL_LEVELS = [
  {
    value: "light",
    label: "Light (< 25% fill)",
    laborMult: 0.95,
    materialMult: 1.0,
    description: "Low cable count; standard tray width",
  },
  {
    value: "medium",
    label: "Medium (25–50% fill)",
    laborMult: 1.0,
    materialMult: 1.1,
    description: "Typical office distribution",
  },
  {
    value: "heavy",
    label: "Heavy (50–75% fill)",
    laborMult: 1.1,
    materialMult: 1.3,
    description: "Wider tray needed; more cable management",
  },
  {
    value: "critical",
    label: "Critical (> 75% fill)",
    laborMult: 1.2,
    materialMult: 1.6,
    description: "Multiple stacked trays or upsized pathway",
  },
] as const;

export const BEND_LABOR_HRS = 0.5;
export const BEND_MATERIAL_COST = 35;
export const PENETRATION_LABOR_HRS = 0.75;
export const PENETRATION_MATERIAL_COST = 50;

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

export const DEFAULT_PATHWAY_RATES: PathwayRates = {
  typeRates: Object.fromEntries(
    PATHWAY_TYPES.map((t) => [
      t.value,
      {
        laborMinPerFt: t.laborMinPerFt,
        materialCostPerFt: t.materialCostPerFt,
        fastenerSpacingFt: t.fastenerSpacingFt,
        fastenerCostEach: t.fastenerCostEach,
        fastenerLaborMinEach: t.fastenerLaborMinEach,
      },
    ]),
  ),
  heightMult: Object.fromEntries(
    MOUNTING_HEIGHTS.map((h) => [h.value, h.multiplier]),
  ),
  ceilingMult: Object.fromEntries(
    PATHWAY_CEILING_TYPES.map((c) => [c.value, c.multiplier]),
  ),
  fillMult: Object.fromEntries(
    CABLE_FILL_LEVELS.map((f) => [
      f.value,
      { laborMult: f.laborMult, materialMult: f.materialMult },
    ]),
  ),
  bendLaborHrs: BEND_LABOR_HRS,
  bendMaterialCost: BEND_MATERIAL_COST,
  penetrationLaborHrs: PENETRATION_LABOR_HRS,
  penetrationMaterialCost: PENETRATION_MATERIAL_COST,
};

/**
 * Merge user-editable rate overrides (typically loaded from /api/rates) on top
 * of the static defaults so the calculator always sees a complete rate table.
 */
export function resolvePathwayRates(
  override?: Partial<PathwayRates> | null,
): PathwayRates {
  if (!override) return DEFAULT_PATHWAY_RATES;
  return {
    typeRates: { ...DEFAULT_PATHWAY_RATES.typeRates, ...(override.typeRates ?? {}) },
    heightMult: { ...DEFAULT_PATHWAY_RATES.heightMult, ...(override.heightMult ?? {}) },
    ceilingMult: { ...DEFAULT_PATHWAY_RATES.ceilingMult, ...(override.ceilingMult ?? {}) },
    fillMult: { ...DEFAULT_PATHWAY_RATES.fillMult, ...(override.fillMult ?? {}) },
    bendLaborHrs: override.bendLaborHrs ?? DEFAULT_PATHWAY_RATES.bendLaborHrs,
    bendMaterialCost: override.bendMaterialCost ?? DEFAULT_PATHWAY_RATES.bendMaterialCost,
    penetrationLaborHrs: override.penetrationLaborHrs ?? DEFAULT_PATHWAY_RATES.penetrationLaborHrs,
    penetrationMaterialCost:
      override.penetrationMaterialCost ?? DEFAULT_PATHWAY_RATES.penetrationMaterialCost,
  };
}

export interface PathwaySegmentInput {
  id: string;
  label: string;
  pathwayType: string;
  lengthFt: number;
  mountingHeight: string;
  ceilingType: string;
  cableFill: string;
  bends: number;
  penetrations: number;
  notes: string;
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

export function calculatePathwaySegment(
  segment: PathwaySegmentInput,
  hourlyRate: number,
  rates: PathwayRates = DEFAULT_PATHWAY_RATES,
): PathwaySegmentResult {
  const meta = PATHWAY_TYPES.find((p) => p.value === segment.pathwayType);
  const typeRate = rates.typeRates[segment.pathwayType];
  const heightMult = rates.heightMult[segment.mountingHeight];

  if (!meta || !typeRate || heightMult === undefined) {
    return {
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
  }

  const length = Math.max(0, segment.lengthFt);

  // Per-each (sleeves & slots): qty-based work, no linear-foot semantics.
  // Skip ceiling/fill multipliers, no fasteners, no bends, no separate
  // penetration adder (the sleeve IS the penetration).
  if (meta.perEach) {
    const baseLaborHrs = ((typeRate.laborMinPerFt * length) / 60) * heightMult;
    const pathwayMaterialCost = typeRate.materialCostPerFt * length;
    const totalLaborHrs = baseLaborHrs;
    const totalMaterialCost = pathwayMaterialCost;
    const laborCost = totalLaborHrs * hourlyRate;
    const totalCost = laborCost + totalMaterialCost;
    const perFtCost = length > 0 ? totalCost / length : 0; // here = $/each
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
      perFtCost,
    };
  }

  // Linear-foot pathways: full multiplier stack
  const ceilingMult = rates.ceilingMult[segment.ceilingType] ?? 1;
  const fill = rates.fillMult[segment.cableFill];
  const fillLaborMult = fill?.laborMult ?? 1;
  const fillMaterialMult = fill?.materialMult ?? 1;

  const baseLaborHrs =
    ((typeRate.laborMinPerFt * length) / 60) *
    heightMult *
    ceilingMult *
    fillLaborMult;

  const fastenerCount =
    typeRate.fastenerSpacingFt > 0 && length > 0
      ? Math.ceil(length / typeRate.fastenerSpacingFt)
      : 0;
  const fastenerLaborHrs =
    ((fastenerCount * typeRate.fastenerLaborMinEach) / 60) * heightMult;

  const bendLaborHrs = segment.bends * rates.bendLaborHrs * heightMult;
  const penetrationLaborHrs = segment.penetrations * rates.penetrationLaborHrs;

  const totalLaborHrs =
    baseLaborHrs + fastenerLaborHrs + bendLaborHrs + penetrationLaborHrs;

  const pathwayMaterialCost = typeRate.materialCostPerFt * length * fillMaterialMult;
  const fastenerMaterialCost = fastenerCount * typeRate.fastenerCostEach;
  const bendMaterialCost = segment.bends * rates.bendMaterialCost;
  const penetrationMaterialCost =
    segment.penetrations * rates.penetrationMaterialCost;

  const totalMaterialCost =
    pathwayMaterialCost +
    fastenerMaterialCost +
    bendMaterialCost +
    penetrationMaterialCost;

  const laborCost = totalLaborHrs * hourlyRate;
  const totalCost = laborCost + totalMaterialCost;
  const perFtCost = length > 0 ? totalCost / length : 0;

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
    perFtCost,
  };
}
