import { useEffect, useState } from "react";
import {
  useGetRates,
  useUpdateRates,
  useResetRates,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Calculator,
  Route as RouteIcon,
  Layers,
  DollarSign,
} from "lucide-react";
import {
  CABLE_TYPES,
  INSTALL_TYPES,
  CEILING_TYPES,
  PATHWAY_LEVELS,
  BUILDING_TYPES,
  ENVIRONMENTS,
  SKILL_LEVELS,
} from "@/lib/options";
import {
  PATHWAY_TYPES,
  MOUNTING_HEIGHTS,
  PATHWAY_CEILING_TYPES,
  DEFAULT_PATHWAY_RATES,
  type PathwayTypeRateValues,
} from "@/lib/pathwayConfig";

interface CustomCableType {
  value: string;
  label: string;
}

interface HardwareCatalogEntry {
  value: string;
  label: string;
  unitCost: number;
  unit?: string | null;
}

interface RatesShape {
  hourlyRate?: number;
  bulkFactorAlpha?: number;
  customCableTypes?: CustomCableType[];
  pullMinutesPer10Ft: Record<string, number>;
  terminationMinutesPerEnd: Record<string, number>;
  installTypeMult: Record<string, number>;
  ceilingMult: Record<string, number>;
  pathwayMult: Record<string, number>;
  buildingMult: Record<string, number>;
  environmentMult: Record<string, number>;
  skillMult: Record<string, number>;
  pathwayTypeRates?: Record<string, PathwayTypeRateValues>;
  pathwayMountingHeightMult?: Record<string, number>;
  pathwayCeilingMult?: Record<string, number>;
  pathwayBendLaborHrs?: number;
  pathwayBendMaterialCost?: number;
  pathwayPenetrationLaborHrs?: number;
  pathwayPenetrationMaterialCost?: number;
  cableMaterialCostPerFt?: Record<string, number>;
  terminationHardwareCostPerEnd?: Record<string, number>;
  hardwareCatalog?: HardwareCatalogEntry[];
  materialWastePercent?: number;
  materialMarkupPercent?: number;
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export default function RatesEditor() {
  const queryClient = useQueryClient();
  const { data: rates } = useGetRates();
  const [draft, setDraft] = useState<RatesShape | null>(null);

  useEffect(() => {
    if (rates && !draft) setDraft(rates as RatesShape);
  }, [rates, draft]);

  const updateRates = useUpdateRates({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
        queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      },
    },
  });

  const resetRates = useResetRates({
    mutation: {
      onSuccess: (data) => {
        setDraft(data as RatesShape);
        queryClient.invalidateQueries({ queryKey: ["/api/rates"] });
        queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
      },
    },
  });

  if (!draft) return <div>Loading rates…</div>;

  const setNested = (
    section: keyof RatesShape,
    key: string,
    value: number,
  ) => {
    setDraft({
      ...draft,
      [section]: {
        ...((draft[section] as Record<string, number>) ?? {}),
        [key]: value,
      },
    });
  };

  const updatePathwayTypeRate = (
    typeValue: string,
    field: keyof PathwayTypeRateValues,
    value: number,
  ) => {
    const current = draft.pathwayTypeRates ?? {};
    const existing =
      current[typeValue] ?? DEFAULT_PATHWAY_RATES.typeRates[typeValue];
    setDraft({
      ...draft,
      pathwayTypeRates: {
        ...current,
        [typeValue]: { ...existing, [field]: value },
      },
    });
  };


  const customCables: CustomCableType[] = draft.customCableTypes ?? [];
  const allCableOptions = [
    ...CABLE_TYPES,
    ...customCables.map((c) => ({ value: c.value, label: c.label })),
  ];

  // Effective values (draft value, falling back to defaults) for pathway sections
  const effectiveTypeRate = (typeValue: string): PathwayTypeRateValues =>
    (draft.pathwayTypeRates ?? {})[typeValue] ??
    DEFAULT_PATHWAY_RATES.typeRates[typeValue];

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-7 h-7" /> Rate Editor
          </h1>
          <p className="text-muted-foreground mt-1">
            Tune base labor rates, condition multipliers, and pathway
            constants used across both estimators.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => resetRates.mutate()}
            data-testid="button-reset-rates"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reset Defaults
          </Button>
          <Button
            onClick={() =>
              updateRates.mutate({
                data: draft as Parameters<
                  typeof updateRates.mutate
                >[0]["data"],
              })
            }
            disabled={updateRates.isPending}
            data-testid="button-save-rates"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateRates.isPending ? "Saving…" : "Save Rates"}
          </Button>
        </div>
      </div>

      {/* ---------------- COMMON ---------------- */}
      <section className="space-y-4">
        <div className="border-l-4 border-primary pl-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Common — used by both estimators
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Settings that apply to the Cabling Estimator and the Pathway
            Calculator.
          </p>
        </div>

        <Card className="md:max-w-md">
          <CardHeader>
            <CardTitle className="text-base">Default Hourly Labor Rate</CardTitle>
            <p className="text-sm text-muted-foreground">
              Used as the default $/hr for new cabling estimates and as the
              starting rate in the Pathway Calculator. Can still be overridden
              per estimate or per pathway session.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                min={0}
                step={1}
                className="w-32 font-mono text-right"
                value={draft.hourlyRate ?? 85}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    hourlyRate: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                data-testid="input-hourly-rate-default"
              />
              <span className="text-muted-foreground text-sm">/hr</span>
            </div>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          The four multipliers below scale labor on every cable run AND every
          pathway segment. A value of 1.0 means no adjustment.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <RateSection
            title="Install Type Multiplier"
            options={INSTALL_TYPES}
            values={draft.installTypeMult}
            onChange={(k, v) => setNested("installTypeMult", k, v)}
          />
          <RateSection
            title="Building Type Multiplier"
            options={BUILDING_TYPES}
            values={draft.buildingMult}
            onChange={(k, v) => setNested("buildingMult", k, v)}
          />
          <RateSection
            title="Environment Multiplier"
            options={ENVIRONMENTS}
            values={draft.environmentMult}
            onChange={(k, v) => setNested("environmentMult", k, v)}
          />
          <RateSection
            title="Skill Level Multiplier"
            options={SKILL_LEVELS}
            values={draft.skillMult}
            onChange={(k, v) => setNested("skillMult", k, v)}
          />
        </div>
      </section>

      {/* ---------------- CABLING ---------------- */}
      <section className="space-y-4">
        <div className="border-l-4 border-primary pl-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Cabling Estimator
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Variables that drive cable pull and termination labor in the
            Cabling Estimator.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RateSection
            title="Pull Time (minutes per 10 ft)"
            subtitle="Base pull labor in minutes for every 10 ft of cable, before any multipliers or bulk-pull difficulty penalty."
            options={allCableOptions}
            values={draft.pullMinutesPer10Ft}
            onChange={(k, v) => setNested("pullMinutesPer10Ft", k, v)}
            step={0.5}
            unit="min / 10 ft"
          />
          <RateSection
            title="Termination Time (minutes per end)"
            subtitle="Each cable is terminated on both ends, so this value is doubled per cable."
            options={allCableOptions}
            values={draft.terminationMinutesPerEnd}
            onChange={(k, v) => setNested("terminationMinutesPerEnd", k, v)}
            step={0.5}
            unit="min / end"
          />
          <RateSection
            title="Ceiling Type Multiplier"
            options={CEILING_TYPES}
            values={draft.ceilingMult}
            onChange={(k, v) => setNested("ceilingMult", k, v)}
          />
          <RateSection
            title="Pathway Complexity Multiplier"
            options={PATHWAY_LEVELS}
            values={draft.pathwayMult}
            onChange={(k, v) => setNested("pathwayMult", k, v)}
          />

          <RateSection
            title="Cable Material Cost ($ / ft)"
            subtitle="Per-foot price of the cable itself. Multiplied by total feet pulled (length × number of cables) for each run."
            options={allCableOptions}
            values={draft.cableMaterialCostPerFt ?? {}}
            onChange={(k, v) => setNested("cableMaterialCostPerFt", k, v)}
            step={0.05}
            unit="$ / ft"
          />
          <RateSection
            title="Termination Hardware ($ / end)"
            subtitle="Connector / jack / boot cost per cable end. Each cable has 2 ends; fiber strands count separately."
            options={allCableOptions}
            values={draft.terminationHardwareCostPerEnd ?? {}}
            onChange={(k, v) =>
              setNested("terminationHardwareCostPerEnd", k, v)
            }
            step={0.25}
            unit="$ / end"
          />

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Bulk Pull Difficulty Formula
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Pulling more cables together is HARDER (friction, weight,
                jamming), so the factor GROWS with cable count using a
                logarithmic curve with diminishing marginal difficulty.
                Termination is never affected by the bulk factor.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <Label htmlFor="bulk-alpha" className="text-xs">
                    Sensitivity α (alpha)
                  </Label>
                  <Input
                    id="bulk-alpha"
                    type="number"
                    min={0}
                    step={0.01}
                    className="w-32 font-mono text-right"
                    value={draft.bulkFactorAlpha ?? 0.15}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        bulkFactorAlpha: Math.max(
                          0,
                          Number(e.target.value) || 0,
                        ),
                      })
                    }
                    data-testid="input-bulk-alpha"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Larger α = steeper penalty for pulling more cables
                  together. Default 0.15.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-sm">
                {[1, 2, 4, 6, 8, 12, 18, 24].map((b) => {
                  const alpha = draft.bulkFactorAlpha ?? 0.15;
                  const factor = 1 + alpha * Math.log(b);
                  const penaltyPct = (factor - 1) * 100;
                  return (
                    <div
                      key={b}
                      className="flex flex-col gap-0.5 bg-muted/40 rounded p-2"
                    >
                      <span className="text-xs text-muted-foreground">
                        numCables = {b}
                      </span>
                      <span className="font-semibold">
                        {factor.toFixed(3)}×
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {penaltyPct < 0.05
                          ? "baseline"
                          : `+${penaltyPct.toFixed(0)}% pull time`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Formula:{" "}
                <code className="bg-muted px-1 rounded">
                  bulkFactor = 1 + α × ln(numCables)
                </code>
                &nbsp;·&nbsp; 1 cable → 1.000× (baseline) &nbsp;·&nbsp; 24
                cables (α=0.15) → ≈ 1.477×
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ---------------- MATERIAL DEFAULTS + CATALOG ---------------- */}
      <section className="space-y-4">
        <div className="border-l-4 border-primary pl-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Materials — used by both estimators
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Defaults for waste %, markup %, and the reusable hardware catalog
            shared by Cabling and Pathway estimates.
          </p>
        </div>

        <Card className="md:max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">Waste & Markup Defaults</CardTitle>
            <p className="text-sm text-muted-foreground">
              Waste % is applied to auto-computed cable material cost only.
              Markup % is applied to the full material subtotal (cable + waste +
              termination + pathway + hardware).
            </p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Cable Waste %</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  className="w-28 font-mono text-right"
                  value={draft.materialWastePercent ?? 10}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      materialWastePercent: Math.max(
                        0,
                        Number(e.target.value) || 0,
                      ),
                    })
                  }
                  data-testid="input-material-waste"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div>
              <Label className="text-sm">Material Markup %</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  className="w-28 font-mono text-right"
                  value={draft.materialMarkupPercent ?? 0}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      materialMarkupPercent: Math.max(
                        0,
                        Number(e.target.value) || 0,
                      ),
                    })
                  }
                  data-testid="input-material-markup"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Hardware Catalog</CardTitle>
              <p className="text-sm text-muted-foreground">
                Reusable parts (patch panels, faceplates, racks, etc.). Items
                here appear in the dropdown when adding hardware to any
                estimate.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDraft({
                  ...draft,
                  hardwareCatalog: [
                    ...(draft.hardwareCatalog ?? []),
                    {
                      value: `item_${(draft.hardwareCatalog?.length ?? 0) + 1}`,
                      label: "New Item",
                      unitCost: 0,
                      unit: "ea",
                    },
                  ],
                })
              }
              data-testid="button-add-catalog-item"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Catalog Item
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead className="w-40">Key</TableHead>
                  <TableHead className="text-right w-32">Unit Cost $</TableHead>
                  <TableHead className="w-24">Unit</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(draft.hardwareCatalog ?? []).map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Input
                        value={item.label}
                        onChange={(e) => {
                          const next = [...(draft.hardwareCatalog ?? [])];
                          next[idx] = { ...item, label: e.target.value };
                          setDraft({ ...draft, hardwareCatalog: next });
                        }}
                        data-testid={`input-catalog-label-${idx}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        className="font-mono text-xs"
                        value={item.value}
                        onChange={(e) => {
                          const next = [...(draft.hardwareCatalog ?? [])];
                          next[idx] = {
                            ...item,
                            value: slugify(e.target.value) || item.value,
                          };
                          setDraft({ ...draft, hardwareCatalog: next });
                        }}
                        data-testid={`input-catalog-key-${idx}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.25}
                        className="font-mono text-right"
                        value={item.unitCost}
                        onChange={(e) => {
                          const next = [...(draft.hardwareCatalog ?? [])];
                          next[idx] = {
                            ...item,
                            unitCost: Math.max(
                              0,
                              Number(e.target.value) || 0,
                            ),
                          };
                          setDraft({ ...draft, hardwareCatalog: next });
                        }}
                        data-testid={`input-catalog-cost-${idx}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.unit ?? ""}
                        onChange={(e) => {
                          const next = [...(draft.hardwareCatalog ?? [])];
                          next[idx] = { ...item, unit: e.target.value };
                          setDraft({ ...draft, hardwareCatalog: next });
                        }}
                        placeholder="ea"
                        data-testid={`input-catalog-unit-${idx}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          const next = [...(draft.hardwareCatalog ?? [])];
                          next.splice(idx, 1);
                          setDraft({ ...draft, hardwareCatalog: next });
                        }}
                        data-testid={`button-delete-catalog-${idx}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(draft.hardwareCatalog ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-sm text-muted-foreground py-6"
                    >
                      No catalog items. Click <strong>Add Catalog Item</strong>{" "}
                      to start.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* ---------------- PATHWAY ---------------- */}
      <section className="space-y-4">
        <div className="border-l-4 border-primary pl-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-primary" />
            Pathway Estimator
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Per-foot costs, multipliers, and bend/penetration constants used
            by the Pathway Calculator.
          </p>
        </div>

        {/* Pathway type rates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Pathway Type Rates
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Per-foot labor and material plus fastener spacing/cost for each
              pathway type.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Pathway Type</TableHead>
                  <TableHead className="text-right">Labor min / ft</TableHead>
                  <TableHead className="text-right">Material $ / ft</TableHead>
                  <TableHead className="text-right">
                    Fastener Spacing ft
                  </TableHead>
                  <TableHead className="text-right">Fastener $ / ea</TableHead>
                  <TableHead className="text-right">
                    Fastener min / ea
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PATHWAY_TYPES.map((p) => {
                  const r = effectiveTypeRate(p.value);
                  return (
                    <TableRow key={p.value}>
                      <TableCell>
                        <div className="font-medium">{p.label}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {p.category}
                          {p.perEach ? " · per-each" : ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <NumCell
                          value={r.laborMinPerFt}
                          step={0.5}
                          onChange={(v) =>
                            updatePathwayTypeRate(
                              p.value,
                              "laborMinPerFt",
                              v,
                            )
                          }
                          testId={`input-pathway-${p.value}-laborMinPerFt`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumCell
                          value={r.materialCostPerFt}
                          step={0.25}
                          onChange={(v) =>
                            updatePathwayTypeRate(
                              p.value,
                              "materialCostPerFt",
                              v,
                            )
                          }
                          testId={`input-pathway-${p.value}-materialCostPerFt`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumCell
                          value={r.fastenerSpacingFt}
                          step={0.5}
                          onChange={(v) =>
                            updatePathwayTypeRate(
                              p.value,
                              "fastenerSpacingFt",
                              v,
                            )
                          }
                          disabled={p.perEach}
                          testId={`input-pathway-${p.value}-fastenerSpacingFt`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumCell
                          value={r.fastenerCostEach}
                          step={0.25}
                          onChange={(v) =>
                            updatePathwayTypeRate(
                              p.value,
                              "fastenerCostEach",
                              v,
                            )
                          }
                          disabled={p.perEach}
                          testId={`input-pathway-${p.value}-fastenerCostEach`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <NumCell
                          value={r.fastenerLaborMinEach}
                          step={0.5}
                          onChange={(v) =>
                            updatePathwayTypeRate(
                              p.value,
                              "fastenerLaborMinEach",
                              v,
                            )
                          }
                          disabled={p.perEach}
                          testId={`input-pathway-${p.value}-fastenerLaborMinEach`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>Per-each types</strong> (e.g. surface raceway boxes) use
              fixed material/labor per pathway; fastener fields are not used.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <RateSection
            title="Mounting Height Multiplier"
            subtitle="Adjusts pathway labor based on how high the pathway is being installed."
            options={MOUNTING_HEIGHTS.map((h) => ({
              value: h.value,
              label: h.label,
            }))}
            values={
              draft.pathwayMountingHeightMult ??
              DEFAULT_PATHWAY_RATES.heightMult
            }
            onChange={(k, v) => setNested("pathwayMountingHeightMult", k, v)}
          />
          <RateSection
            title="Pathway Ceiling Multiplier"
            subtitle="Adjusts pathway labor based on the structure the pathway is mounted to."
            options={PATHWAY_CEILING_TYPES.map((c) => ({
              value: c.value,
              label: c.label,
            }))}
            values={
              draft.pathwayCeilingMult ?? DEFAULT_PATHWAY_RATES.ceilingMult
            }
            onChange={(k, v) => setNested("pathwayCeilingMult", k, v)}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">90° Bend Constants</CardTitle>
              <p className="text-sm text-muted-foreground">
                Labor and material added per 90° bend in a pathway run. The
                mounting height multiplier is also applied to bend labor.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm">Labor per bend</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step={0.05}
                    min={0}
                    className="w-24 font-mono text-right"
                    value={
                      draft.pathwayBendLaborHrs ??
                      DEFAULT_PATHWAY_RATES.bendLaborHrs
                    }
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        pathwayBendLaborHrs: Math.max(
                          0,
                          Number(e.target.value) || 0,
                        ),
                      })
                    }
                    data-testid="input-pathway-bend-labor"
                  />
                  <span className="text-xs text-muted-foreground w-20">
                    hrs / bend
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm">Material per bend</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    step={1}
                    min={0}
                    className="w-24 font-mono text-right"
                    value={
                      draft.pathwayBendMaterialCost ??
                      DEFAULT_PATHWAY_RATES.bendMaterialCost
                    }
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        pathwayBendMaterialCost: Math.max(
                          0,
                          Number(e.target.value) || 0,
                        ),
                      })
                    }
                    data-testid="input-pathway-bend-material"
                  />
                  <span className="text-xs text-muted-foreground w-20">
                    / bend
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Wall / Floor Penetration Constants
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Labor and material added per wall or floor penetration along a
                pathway run.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm">Labor per penetration</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step={0.05}
                    min={0}
                    className="w-24 font-mono text-right"
                    value={
                      draft.pathwayPenetrationLaborHrs ??
                      DEFAULT_PATHWAY_RATES.penetrationLaborHrs
                    }
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        pathwayPenetrationLaborHrs: Math.max(
                          0,
                          Number(e.target.value) || 0,
                        ),
                      })
                    }
                    data-testid="input-pathway-pen-labor"
                  />
                  <span className="text-xs text-muted-foreground w-20">
                    hrs / pen.
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm">Material per penetration</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    step={1}
                    min={0}
                    className="w-24 font-mono text-right"
                    value={
                      draft.pathwayPenetrationMaterialCost ??
                      DEFAULT_PATHWAY_RATES.penetrationMaterialCost
                    }
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        pathwayPenetrationMaterialCost: Math.max(
                          0,
                          Number(e.target.value) || 0,
                        ),
                      })
                    }
                    data-testid="input-pathway-pen-material"
                  />
                  <span className="text-xs text-muted-foreground w-20">
                    / pen.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}

function NumCell({
  value,
  onChange,
  step = 0.05,
  disabled,
  testId,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <Input
      type="number"
      step={step}
      min={0}
      disabled={disabled}
      className="w-24 font-mono text-right ml-auto"
      value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      data-testid={testId}
    />
  );
}

function RateSection({
  title,
  subtitle,
  options,
  values,
  onChange,
  step = 0.05,
  unit,
  customKeys = [],
  onDeleteCustom,
  onAddCustom,
}: {
  title: string;
  subtitle?: string;
  options: readonly { value: string; label: string }[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  step?: number;
  unit?: string;
  customKeys?: string[];
  onDeleteCustom?: (key: string) => void;
  onAddCustom?: () => void;
}) {
  const customSet = new Set(customKeys);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {onAddCustom && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={onAddCustom}
              data-testid="button-add-cable-type"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Cable Type
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((o) => (
          <div
            key={o.value}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Label className="text-sm truncate">{o.label}</Label>
              {customSet.has(o.value) && onDeleteCustom && (
                <button
                  type="button"
                  onClick={() => onDeleteCustom(o.value)}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  title={`Remove ${o.label}`}
                  data-testid={`button-delete-cable-${o.value}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Input
                type="number"
                step={step}
                className="w-24 font-mono text-right"
                value={values[o.value] ?? 0}
                onChange={(e) =>
                  onChange(o.value, Number(e.target.value) || 0)
                }
                data-testid={`input-${o.value}`}
              />
              {unit && (
                <span className="text-xs text-muted-foreground w-20 shrink-0">
                  {unit}
                </span>
              )}
            </div>
          </div>
        ))}
        {options.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No cable types defined.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
