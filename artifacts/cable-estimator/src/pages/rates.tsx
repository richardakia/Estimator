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
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  FlaskConical,
  Plus,
  Trash2,
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

interface CustomCableType {
  value: string;
  label: string;
}

interface RatesShape {
  customCableTypes?: CustomCableType[];
  pullMinutesPer10Ft: Record<string, number>;
  terminationMinutesPerEnd: Record<string, number>;
  installTypeMult: Record<string, number>;
  ceilingMult: Record<string, number>;
  pathwayMult: Record<string, number>;
  buildingMult: Record<string, number>;
  environmentMult: Record<string, number>;
  skillMult: Record<string, number>;
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

  const setNested = (section: keyof RatesShape, key: string, value: number) => {
    setDraft({
      ...draft,
      [section]: {
        ...(draft[section] as Record<string, number>),
        [key]: value,
      },
    });
  };

  const builtInKeys = new Set(CABLE_TYPES.map((c) => c.value));
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-7 h-7" /> Rate Editor
          </h1>
          <p className="text-muted-foreground mt-1">
            Tune base labor rates and condition multipliers used by the
            estimator.
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
                data: draft as Parameters<typeof updateRates.mutate>[0]["data"],
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

      {/* Estimation Formula */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            How Each Cable Run Is Estimated
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Every value you edit below feeds directly into these formulas. All times convert to hours for the final output.
          </p>
        </CardHeader>
        <CardContent className="space-y-5 text-sm">

          <div className="space-y-1">
            <p className="font-semibold text-foreground">Step 1 — Condition Multiplier</p>
            <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs leading-relaxed">
              conditionMult = installType × ceiling × pathway × building × environment × skill
            </div>
            <p className="text-muted-foreground text-xs">
              Multiplied together from the six condition sections below. A value of 1.0 means no adjustment.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">Step 2 — Bulk Factor</p>
            <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs leading-relaxed">
              bulkFactor = 0.4 + (0.6 / numCables)
            </div>
            <p className="text-muted-foreground text-xs">
              numCables is the # of cables in a single pull. Solo pull (1) → 1.000× (no discount). 12 cables → 0.450×. 24 cables → 0.425×. Termination is never bulk-discounted.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">Step 3 — Pull Hours per Cable Run</p>
            <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs leading-relaxed">
              pullHrs = (pullMin10ft ÷ 60) × (lengthFt ÷ 10) × conditionMult × bulkFactor × numCables
            </div>
            <p className="text-muted-foreground text-xs">
              Pull time scales linearly with cable length and cable count. bulkFactor from Step 2 discounts the per-cable pull time when multiple cables share the same pathway.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">Step 4 — Termination Hours per Cable Run</p>
            <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs leading-relaxed">
              termHrs = (termMinPerEnd × 2 ends) ÷ 60 × conditionMult × numCables
            </div>
            <p className="text-muted-foreground text-xs">
              Every cable is terminated at both ends. Termination is never bulk-discounted — it scales only with cable count and the condition multiplier.
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-foreground">Step 5 — Total Run Hours &amp; Range</p>
            <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs leading-relaxed space-y-0.5">
              <div>runHrsAvg  = pullHrs + termHrs</div>
              <div>runHrsLow  = runHrsAvg × 0.85&nbsp;&nbsp;(best case)</div>
              <div>runHrsHigh = runHrsAvg × 1.20&nbsp;&nbsp;(worst case)</div>
              <div className="pt-1">runCost = runHrsAvg × hourlyRate</div>
            </div>
            <p className="text-muted-foreground text-xs">
              The low/high range accounts for real-world variability. Totals across all runs are summed to produce the estimate's overall hours and cost.
            </p>
          </div>

        </CardContent>
      </Card>

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
          title="Install Type Multiplier"
          options={INSTALL_TYPES}
          values={draft.installTypeMult}
          onChange={(k, v) => setNested("installTypeMult", k, v)}
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

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Bulk Pull Efficiency Formula</CardTitle>
            <p className="text-sm text-muted-foreground">
              Each run's <strong># of Cables</strong> is used as B directly in the formula.
              More cables pulled together = lower factor = faster per-cable pull time.
              Termination is never bulk-discounted.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-sm">
              {[1, 2, 4, 6, 8, 12, 18, 24].map((b) => (
                <div key={b} className="flex flex-col gap-0.5 bg-muted/40 rounded p-2">
                  <span className="text-xs text-muted-foreground">numCables = {b}</span>
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
              Formula: <code className="bg-muted px-1 rounded">bulkFactor = 0.4 + (0.6 / numCables)</code>
              &nbsp;·&nbsp; 1 cable → 1.000× (no savings) &nbsp;·&nbsp; 24 cables → 0.425×
            </p>
          </CardContent>
        </Card>
      </div>

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
                <Label htmlFor="new-cable-pull">Pull Time (min / 10 ft)</Label>
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
                <Label htmlFor="new-cable-term">Termination (min / end)</Label>
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
            <Button onClick={handleAddCable} data-testid="button-confirm-add-cable">
              <Plus className="w-4 h-4 mr-2" /> Add Cable Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
              <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
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
          <div key={o.value} className="flex items-center justify-between gap-3">
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
                onChange={(e) => onChange(o.value, Number(e.target.value) || 0)}
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
