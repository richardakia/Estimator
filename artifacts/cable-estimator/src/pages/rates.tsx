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
import { RotateCcw, Save, Settings as SettingsIcon } from "lucide-react";
import {
  CABLE_TYPES,
  INSTALL_TYPES,
  CEILING_TYPES,
  PATHWAY_LEVELS,
  BUILDING_TYPES,
  ENVIRONMENTS,
  SKILL_LEVELS,
} from "@/lib/options";

interface RatesShape {
  baseHoursPerDrop: Record<string, number>;
  installTypeMult: Record<string, number>;
  ceilingMult: Record<string, number>;
  pathwayMult: Record<string, number>;
  buildingMult: Record<string, number>;
  environmentMult: Record<string, number>;
  skillMult: Record<string, number>;
  bulkPullFactors: Record<string, number>;
  pullPortionPct: number;
  lengthAdd150ft: number;
  lengthAdd250ft: number;
}

const BULK_LABELS: Array<[keyof RatesShape["bulkPullFactors"] | string, string]> = [
  ["single", "1 cable"],
  ["small", "2 cables"],
  ["medium", "3–4 cables"],
  ["large", "5–8 cables"],
  ["xlarge", "9–12 cables"],
  ["xxlarge", "13–24 cables"],
  ["massive", "25+ cables"],
];

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
        ...(draft[section] as Record<string, number>),
        [key]: value,
      },
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

      <div className="grid gap-6 md:grid-cols-2">
        <RateSection
          title="Base Hours per Cable Drop"
          subtitle="Baseline labor for one cable run before any multipliers."
          options={CABLE_TYPES}
          values={draft.baseHoursPerDrop}
          onChange={(k, v) => setNested("baseHoursPerDrop", k, v)}
          step={0.05}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Bulk Pull Efficiency Factor
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Per-cable pull time is multiplied by this factor based on how many
              cables share the same pathway.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {BULK_LABELS.map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3"
              >
                <Label className="text-sm">{label}</Label>
                <Input
                  type="number"
                  step={0.05}
                  min={0.1}
                  max={1}
                  className="w-24 font-mono text-right"
                  value={draft.bulkPullFactors[key] ?? 1}
                  onChange={(e) =>
                    setNested(
                      "bulkPullFactors",
                      key as string,
                      Number(e.target.value) || 0,
                    )
                  }
                  data-testid={`input-bulk-${key}`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Other Constants</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Pull-portion of cable time (0–1)</Label>
              <Input
                type="number"
                step={0.05}
                min={0}
                max={1}
                value={draft.pullPortionPct}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    pullPortionPct: Number(e.target.value) || 0,
                  })
                }
                data-testid="input-pull-portion"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fraction of base time that gets bulk-pull discount.
              </p>
            </div>
            <div>
              <Label>Length add &gt;150 ft (hrs)</Label>
              <Input
                type="number"
                step={0.05}
                min={0}
                value={draft.lengthAdd150ft}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    lengthAdd150ft: Number(e.target.value) || 0,
                  })
                }
                data-testid="input-len150"
              />
            </div>
            <div>
              <Label>Length add &gt;250 ft (hrs)</Label>
              <Input
                type="number"
                step={0.05}
                min={0}
                value={draft.lengthAdd250ft}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    lengthAdd250ft: Number(e.target.value) || 0,
                  })
                }
                data-testid="input-len250"
              />
            </div>
          </CardContent>
        </Card>
      </div>
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
}: {
  title: string;
  subtitle?: string;
  options: readonly { value: string; label: string }[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
  step?: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {options.map((o) => (
          <div key={o.value} className="flex items-center justify-between gap-3">
            <Label className="text-sm">{o.label}</Label>
            <Input
              type="number"
              step={step}
              className="w-24 font-mono text-right"
              value={values[o.value] ?? 0}
              onChange={(e) => onChange(o.value, Number(e.target.value) || 0)}
              data-testid={`input-${o.value}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
