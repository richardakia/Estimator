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
  CABLE_FILL_LEVELS,
  DEFAULT_PATHWAY_RATES,
  type PathwayTypeRateValues,
  type CableFillMultValues,
} from "@/lib/pathwayConfig";

interface CustomCableType {
  value: string;
  label: string;
}

interface RatesShape {
  hourlyRate?: number;
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
  pathwayCableFillMult?: Record<string, CableFillMultValues>;
  pathwayBendLaborHrs?: number;
  pathwayBendMaterialCost?: number;
  pathwayPenetrationLaborHrs?: number;
  pathwayPenetrationMaterialCost?: number;
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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPull, setNewPull] = useState(3.0);
  const [newTerm, setNewTerm] = useState(5);
  const [addError, setAddError] = useState("");

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

  const updateCableFill = (
    fillValue: string,
    field: keyof CableFillMultValues,
    value: number,
  ) => {
    const current = draft.pathwayCableFillMult ?? {};
    const existing =
      current[fillValue] ?? DEFAULT_PATHWAY_RATES.fillMult[fillValue];
    setDraft({
      ...draft,
      pathwayCableFillMult: {
        ...current,
        [fillValue]: { ...existing, [field]: value },
      },
    });
  };

  const builtInKeys = new Set(CABLE_TYPES.map((c) => c.value));
  void builtInKeys;
  const customCables: CustomCableType[] = draft.customCableTypes ?? [];
  const allCableOptions = [
    ...CABLE_TYPES,
    ...customCables.map((c) => ({ value: c.value, label: c.label })),
  ];

  const handleAddCable = () => {
    const label = newLabel.trim();
    if (!label) {
      setAddError("Please enter a name for the cable type.");
      return;
    }
    const value = slugify(label);
    if (!value) {
      setAddError("Name must contain at least one letter or number.");
      return;
    }
    if (allCableOptions.some((c) => c.value === value)) {
      setAddError(`A cable type with key "${value}" already exists.`);
      return;
    }
    setDraft({
      ...draft,
      customCableTypes: [...customCables, { value, label }],
      pullMinutesPer10Ft: { ...draft.pullMinutesPer10Ft, [value]: newPull },
      terminationMinutesPerEnd: {
        ...draft.terminationMinutesPerEnd,
        [value]: newTerm,
      },
    });
    setNewLabel("");
    setNewPull(3.0);
    setNewTerm(5);
    setAddError("");
    setAddDialogOpen(false);
  };

  const handleDeleteCable = (cableValue: string) => {
    const updatedCustom = customCables.filter((c) => c.value !== cableValue);
    const updatedPull = { ...draft.pullMinutesPer10Ft };
    const updatedTerm = { ...draft.terminationMinutesPerEnd };
    delete updatedPull[cableValue];
    delete updatedTerm[cableValue];
    setDraft({
      ...draft,
      customCableTypes: updatedCustom,
      pullMinutesPer10Ft: updatedPull,
      terminationMinutesPerEnd: updatedTerm,
    });
  };

  // Effective values (draft value, falling back to defaults) for pathway sections
  const effectiveTypeRate = (typeValue: string): PathwayTypeRateValues =>
    (draft.pathwayTypeRates ?? {})[typeValue] ??
    DEFAULT_PATHWAY_RATES.typeRates[typeValue];
  const effectiveCableFill = (fillValue: string): CableFillMultValues =>
    (draft.pathwayCableFillMult ?? {})[fillValue] ??
    DEFAULT_PATHWAY_RATES.fillMult[fillValue];

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
            subtitle="Base pull labor in minutes for every 10 ft of cable, before any multipliers or bulk-pull discount."
            options={allCableOptions}
            values={draft.pullMinutesPer10Ft}
            onChange={(k, v) => setNested("pullMinutesPer10Ft", k, v)}
            step={0.5}
            unit="min / 10 ft"
            customKeys={customCables.map((c) => c.value)}
            onDeleteCustom={handleDeleteCable}
            onAddCustom={() => setAddDialogOpen(true)}
          />
          <RateSection
            title="Termination Time (minutes per end)"
            subtitle="Each cable is terminated on both ends, so this value is doubled per cable."
            options={allCableOptions}
            values={draft.terminationMinutesPerEnd}
            onChange={(k, v) => setNested("terminationMinutesPerEnd", k, v)}
            step={0.5}
            unit="min / end"
            customKeys={customCables.map((c) => c.value)}
            onDeleteCustom={handleDeleteCable}
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

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Bulk Pull Efficiency Formula
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Each run's <strong># of Cables</strong> is used as B directly
                in the formula. More cables pulled together = lower factor =
                faster per-cable pull time. Termination is never
                bulk-discounted.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-sm">
                {[1, 2, 4, 6, 8, 12, 18, 24].map((b) => (
                  <div
                    key={b}
                    className="flex flex-col gap-0.5 bg-muted/40 rounded p-2"
                  >
                    <span className="text-xs text-muted-foreground">
                      numCables = {b}
                    </span>
                    <span className="font-semibold">
                      {(0.4 + 0.6 / b).toFixed(3)}×
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {(100 - (0.4 + 0.6 / b) * 100).toFixed(0)}% pull savings
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Formula:{" "}
                <code className="bg-muted px-1 rounded">
                  bulkFactor = 0.4 + (0.6 / numCables)
                </code>
                &nbsp;·&nbsp; 1 cable → 1.000× (no savings) &nbsp;·&nbsp; 24
                cables → 0.425×
              </p>
            </CardContent>
          </Card>
        </div>
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

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">
                Cable Fill Multipliers
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Labor and material multipliers based on how full the pathway
                is.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Fill Level</TableHead>
                    <TableHead className="text-right">
                      Labor multiplier
                    </TableHead>
                    <TableHead className="text-right">
                      Material multiplier
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CABLE_FILL_LEVELS.map((f) => {
                    const r = effectiveCableFill(f.value);
                    return (
                      <TableRow key={f.value}>
                        <TableCell>
                          <div className="font-medium">{f.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {f.description}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <NumCell
                            value={r.laborMult}
                            step={0.05}
                            onChange={(v) =>
                              updateCableFill(f.value, "laborMult", v)
                            }
                            testId={`input-fill-${f.value}-laborMult`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <NumCell
                            value={r.materialMult}
                            step={0.05}
                            onChange={(v) =>
                              updateCableFill(f.value, "materialMult", v)
                            }
                            testId={`input-fill-${f.value}-materialMult`}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

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

      {/* Add Cable Type Dialog */}
      <Dialog
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) {
            setNewLabel("");
            setNewPull(3.0);
            setNewTerm(5);
            setAddError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Cable Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="new-cable-label">Cable Name</Label>
              <Input
                id="new-cable-label"
                placeholder="e.g. 18/2 Plenum, HDMI, Shielded Cat6A"
                value={newLabel}
                onChange={(e) => {
                  setNewLabel(e.target.value);
                  setAddError("");
                }}
                data-testid="input-new-cable-label"
              />
              {newLabel.trim() && (
                <p className="text-xs text-muted-foreground">
                  Key: <span className="font-mono">{slugify(newLabel)}</span>
                </p>
              )}
              {addError && (
                <p className="text-xs text-destructive">{addError}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="new-cable-pull">
                  Pull Time (min / 10 ft)
                </Label>
                <Input
                  id="new-cable-pull"
                  type="number"
                  step={0.5}
                  min={0.1}
                  className="font-mono"
                  value={newPull}
                  onChange={(e) => setNewPull(Number(e.target.value) || 0)}
                  data-testid="input-new-cable-pull"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new-cable-term">
                  Termination (min / end)
                </Label>
                <Input
                  id="new-cable-term"
                  type="number"
                  step={0.5}
                  min={0.1}
                  className="font-mono"
                  value={newTerm}
                  onChange={(e) => setNewTerm(Number(e.target.value) || 0)}
                  data-testid="input-new-cable-term"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCable}
              data-testid="button-confirm-add-cable"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Cable Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
