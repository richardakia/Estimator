export const CABLE_TYPES = [
  { value: "category", label: "Category Cable" },
  { value: "fiber", label: "Fiber Cable" },
  { value: "coax", label: "Coaxial Cable" },
  { value: "speaker_cable", label: "Speaker Cable" },
] as const;

export const INSTALL_TYPES = [
  { value: "new_install", label: "New Install" },
  { value: "retrofit", label: "Retrofit" },
  { value: "deinstall", label: "De-install" },
] as const;

export const CEILING_TYPES = [
  { value: "open", label: "Open / Exposed" },
  { value: "drywall", label: "Drywall / T-bar" },
  { value: "hard_lid", label: "Hard Lid" },
] as const;

export const PATHWAY_LEVELS = [
  { value: "low", label: "Low (existing tray)" },
  { value: "medium", label: "Medium (some new pathway)" },
  { value: "high", label: "High (full new conduit)" },
] as const;

export const BUILDING_TYPES = [
  { value: "office", label: "Office" },
  { value: "warehouse", label: "Warehouse" },
  { value: "retail", label: "Retail" },
  { value: "healthcare", label: "Healthcare" },
] as const;

export const ENVIRONMENTS = [
  { value: "occupied", label: "Occupied (live work)" },
  { value: "unoccupied", label: "Unoccupied" },
] as const;

export const SKILL_LEVELS = [
  { value: "apprentice", label: "Apprentice" },
  { value: "journeyman", label: "Journeyman" },
  { value: "lead", label: "Lead Tech" },
] as const;

export function labelFor<T extends { value: string; label: string }>(
  list: readonly T[],
  value: string,
): string {
  return list.find((x) => x.value === value)?.label ?? value;
}
