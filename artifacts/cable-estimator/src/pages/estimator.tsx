import { useEffect, useMemo, useRef, useState } from "react";
import {
  useGetEstimate,
  useGetRates,
  useCreateEstimate,
  useUpdateEstimate,
  useDeleteEstimate,
  useCreateRun,
  useUpdateRun,
  useDeleteRun,
  getGetEstimateQueryKey,
} from "@workspace/api-client-react";
import type {
  CreateEstimateBody,
  CreateRunBody,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  Calculator as CalcIcon,
  Clock,
  DollarSign,
  TrendingDown,
  Cable,
  FlaskConical,
  FileDown,
} from "lucide-react";
import { generateEstimatePdf } from "@/lib/pdfReport";
import { MaterialsCard } from "@/components/MaterialsCard";
import type { HardwareItem, MaterialBreakdown, HardwareCatalogItem } from "@workspace/api-client-react";
import {
  CABLE_TYPES,
  INSTALL_TYPES,
  CEILING_TYPES,
  PATHWAY_LEVELS,
  BUILDING_TYPES,
  ENVIRONMENTS,
  SKILL_LEVELS,
  labelFor,
} from "@/lib/options";
import { useEstimates } from "@/lib/estimates-context";

const fmtHours = (n: number) => `${n.toFixed(1)} h`;
const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

type EstimateForm = CreateEstimateBody;
type RunForm = CreateRunBody;

const DEFAULT_ESTIMATE: EstimateForm = {
  name: "",
  installType: "new_install",
  buildingType: "office",
  environment: "unoccupied",
  skillLevel: "journeyman",
  hourlyRate: 85,
  notes: "",
};

const DEFAULT_RUN: RunForm = {
  label: "",
  cableType: "category",
  description: "",
  numCables: 12,
  fiberStrands: 1,
  lengthFt: 150,
  ceilingType: "drywall",
  pathwayComplexity: "medium",
};

export default function Estimator() {
  const queryClient = useQueryClient();
  const { selectedId, setSelectedId, newEstOpen, setNewEstOpen } = useEstimates();
  const [newEstForm, setNewEstForm] = useState<EstimateForm>(DEFAULT_ESTIMATE);

  const { data: ratesData } = useGetRates();
  const ratesHourlyRate =
    (ratesData as { hourlyRate?: number } | undefined)?.hourlyRate ?? 85;

  // Prefill hourlyRate from the shared "Common" default in the Rate Editor.
  // Handles the race where the dialog opens before /api/rates resolves: we
  // seed once on open with whatever value is available, and then sync once
  // more if rates become available later in the same dialog session. After
  // that we never overwrite the user's edits.
  const dialogOpenedRef = useRef(false);
  const ratesAppliedRef = useRef(false);
  useEffect(() => {
    if (!newEstOpen) {
      dialogOpenedRef.current = false;
      ratesAppliedRef.current = false;
      return;
    }
    if (!dialogOpenedRef.current) {
      dialogOpenedRef.current = true;
      setNewEstForm((prev) => ({ ...prev, hourlyRate: ratesHourlyRate }));
      if (ratesData) ratesAppliedRef.current = true;
      return;
    }
    if (!ratesAppliedRef.current && ratesData) {
      ratesAppliedRef.current = true;
      setNewEstForm((prev) => ({ ...prev, hourlyRate: ratesHourlyRate }));
    }
  }, [newEstOpen, ratesData, ratesHourlyRate]);

  const allCableTypes = useMemo(() => {
    const custom = (ratesData as { customCableTypes?: { value: string; label: string }[] } | undefined)
      ?.customCableTypes ?? [];
    return [
      ...CABLE_TYPES,
      ...custom.map((c: { value: string; label: string }) => ({ value: c.value, label: c.label })),
    ];
  }, [ratesData]);

  const { data: detail } = useGetEstimate(selectedId ?? 0, {
    query: {
      enabled: selectedId !== null,
      queryKey: getGetEstimateQueryKey(selectedId ?? 0),
    },
  });

  const createEstimate = useCreateEstimate({
    mutation: {
      onSuccess: (created) => {
        queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
        setSelectedId(created.id);
        setNewEstOpen(false);
        setNewEstForm(DEFAULT_ESTIMATE);
      },
    },
  });

  const deleteEstimate = useDeleteEstimate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
        setSelectedId(null);
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Cabling Labor Estimator
        </h1>
        <p className="text-muted-foreground mt-1">
          Select an estimate from the sidebar or create a new one. Bulk pulling
          efficiency is applied automatically.
        </p>
      </div>

      {!selectedId ? (
        <Card>
          <CardContent className="py-20 text-center text-muted-foreground">
            <CalcIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="mb-4">Choose an estimate from the sidebar dropdown to view it here.</p>
            <Button onClick={() => setNewEstOpen(true)} data-testid="button-new-estimate">
              <Plus className="w-4 h-4 mr-2" /> New Estimate
            </Button>
          </CardContent>
        </Card>
      ) : detail ? (
        <EstimateDetail
          detail={detail}
          onDelete={() => deleteEstimate.mutate({ id: detail.estimate.id })}
          cableTypes={allCableTypes}
        />
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      )}

      <Dialog open={newEstOpen} onOpenChange={setNewEstOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Estimate</DialogTitle>
            <DialogDescription>
              Set the project context. You can add cable runs after.
            </DialogDescription>
          </DialogHeader>
          <EstimateFormFields form={newEstForm} setForm={setNewEstForm} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewEstOpen(false)}
              data-testid="button-cancel-estimate"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                createEstimate.mutate({
                  data: {
                    ...newEstForm,
                    notes: newEstForm.notes || undefined,
                  },
                })
              }
              disabled={!newEstForm.name.trim() || createEstimate.isPending}
              data-testid="button-save-estimate"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EstimateFormFields({
  form,
  setForm,
}: {
  form: EstimateForm;
  setForm: (f: EstimateForm) => void;
}) {
  return (
    <div className="grid gap-4">
      <div>
        <Label htmlFor="est-name">Estimate Name</Label>
        <Input
          id="est-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Acme HQ Floor 3 Refresh"
          data-testid="input-estimate-name"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Install Type</Label>
          <Select
            value={form.installType}
            onValueChange={(v) => setForm({ ...form, installType: v as EstimateForm["installType"] })}
          >
            <SelectTrigger data-testid="select-install-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INSTALL_TYPES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Building Type</Label>
          <Select
            value={form.buildingType}
            onValueChange={(v) => setForm({ ...form, buildingType: v as EstimateForm["buildingType"] })}
          >
            <SelectTrigger data-testid="select-building-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUILDING_TYPES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Environment</Label>
          <Select
            value={form.environment}
            onValueChange={(v) => setForm({ ...form, environment: v as EstimateForm["environment"] })}
          >
            <SelectTrigger data-testid="select-environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENVIRONMENTS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Skill Level</Label>
          <Select
            value={form.skillLevel}
            onValueChange={(v) => setForm({ ...form, skillLevel: v as EstimateForm["skillLevel"] })}
          >
            <SelectTrigger data-testid="select-skill-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SKILL_LEVELS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label htmlFor="est-rate">Hourly Rate ($)</Label>
          <Input
            id="est-rate"
            type="number"
            value={form.hourlyRate}
            onChange={(e) =>
              setForm({ ...form, hourlyRate: Number(e.target.value) || 0 })
            }
            data-testid="input-hourly-rate"
          />
        </div>
      </div>
    </div>
  );
}

interface EstimateDetailData {
  estimate: {
    id: number;
    name: string;
    installType: string;
    buildingType: string;
    environment: string;
    skillLevel: string;
    hourlyRate: number;
    notes?: string | null;
  };
  runs: Array<{
    runId?: number;
    label: string;
    cableType: string;
    description?: string | null;
    numCables: number;
    fiberStrands?: number;
    lengthFt: number;
    ceilingType: string;
    pathwayComplexity: string;
    bulkFactor: number;
    pullMinutesPer10Ft: number;
    terminationMinutesPerEnd: number;
    conditionMultiplier: number;
    pullHoursPerCable: number;
    terminationHoursPerCable: number;
    adjustedHoursPerCable: number;
    runHoursLow: number;
    runHoursAvg: number;
    runHoursHigh: number;
    runCostLow: number;
    runCostAvg: number;
    runCostHigh: number;
  }>;
  totals: {
    totalCables: number;
    totalRuns: number;
    totalHoursLow: number;
    totalHoursAvg: number;
    totalHoursHigh: number;
    totalCostLow: number;
    totalCostAvg: number;
    totalCostHigh: number;
    bulkSavingsHours: number;
    taskBreakdown: Array<{
      task: string;
      percent: number;
      hoursAvg: number;
      costAvg: number;
    }>;
  };
  hardwareItems: HardwareItem[];
  materials: MaterialBreakdown;
  projectTotal: number;
}

function EstimateDetail({
  detail,
  onDelete,
  cableTypes,
}: {
  detail: EstimateDetailData;
  onDelete: () => void;
  cableTypes: readonly { value: string; label: string }[];
}) {
  const queryClient = useQueryClient();
  const { data: ratesData } = useGetRates();
  const { estimate, runs, totals, hardwareItems, materials, projectTotal } = detail;
  const catalog = ((ratesData as { hardwareCatalog?: HardwareCatalogItem[] } | undefined)?.hardwareCatalog) ?? [];
  const [editingContext, setEditingContext] = useState(false);
  const [contextForm, setContextForm] = useState<EstimateForm>({
    name: estimate.name,
    installType: estimate.installType as EstimateForm["installType"],
    buildingType: estimate.buildingType as EstimateForm["buildingType"],
    environment: estimate.environment as EstimateForm["environment"],
    skillLevel: estimate.skillLevel as EstimateForm["skillLevel"],
    hourlyRate: estimate.hourlyRate,
    notes: estimate.notes ?? "",
  });

  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [runForm, setRunForm] = useState<RunForm>(DEFAULT_RUN);
  const [editingRunId, setEditingRunId] = useState<number | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/estimates"] });
    queryClient.invalidateQueries({
      queryKey: [`/api/estimates/${estimate.id}`],
    });
  };

  const updateEstimate = useUpdateEstimate({
    mutation: {
      onSuccess: () => {
        invalidate();
        setEditingContext(false);
      },
    },
  });

  const createRun = useCreateRun({
    mutation: {
      onSuccess: () => {
        invalidate();
        setRunDialogOpen(false);
        setRunForm(DEFAULT_RUN);
      },
    },
  });

  const updateRun = useUpdateRun({
    mutation: {
      onSuccess: () => {
        invalidate();
        setRunDialogOpen(false);
        setEditingRunId(null);
        setRunForm(DEFAULT_RUN);
      },
    },
  });

  const deleteRun = useDeleteRun({
    mutation: { onSuccess: invalidate },
  });

  const openNewRun = () => {
    setEditingRunId(null);
    setRunForm({ ...DEFAULT_RUN, label: `Run ${runs.length + 1}` });
    setRunDialogOpen(true);
  };

  const openEditRun = (r: EstimateDetailData["runs"][number]) => {
    setEditingRunId(r.runId ?? null);
    setRunForm({
      label: r.label,
      cableType: r.cableType as RunForm["cableType"],
      description: r.description ?? "",
      numCables: r.numCables,
      fiberStrands: r.fiberStrands ?? 1,
      lengthFt: r.lengthFt,
      ceilingType: r.ceilingType as RunForm["ceilingType"],
      pathwayComplexity: r.pathwayComplexity as RunForm["pathwayComplexity"],
    });
    setRunDialogOpen(true);
  };

  const submitRun = () => {
    if (editingRunId !== null) {
      updateRun.mutate({ id: editingRunId, data: runForm });
    } else {
      createRun.mutate({ id: estimate.id, data: runForm });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle data-testid="text-estimate-name">
              {estimate.name}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">
                {labelFor(INSTALL_TYPES, estimate.installType)}
              </Badge>
              <Badge variant="secondary">
                {labelFor(BUILDING_TYPES, estimate.buildingType)}
              </Badge>
              <Badge variant="secondary">
                {labelFor(ENVIRONMENTS, estimate.environment)}
              </Badge>
              <Badge variant="secondary">
                {labelFor(SKILL_LEVELS, estimate.skillLevel)}
              </Badge>
              <Badge variant="outline">${estimate.hourlyRate}/hr</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => generateEstimatePdf(detail, ratesData ?? {
                pullMinutesPer10Ft: {},
                terminationMinutesPerEnd: {},
                installTypeMult: {},
                ceilingMult: {},
                pathwayMult: {},
                buildingMult: {},
                environmentMult: {},
                skillMult: {},
              })}
              data-testid="button-create-report"
            >
              <FileDown className="w-3.5 h-3.5 mr-1.5" /> Create Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingContext(true)}
              data-testid="button-edit-context"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              data-testid="button-delete-estimate"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 text-destructive" /> Delete
            </Button>
          </div>
        </CardHeader>
      </Card>
      {/* Totals */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<Cable className="w-4 h-4" />}
          label="Cables / Runs"
          value={`${totals.totalCables} / ${totals.totalRuns}`}
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Total Hours"
          value={fmtHours(totals.totalHoursAvg)}
        />
        <StatCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Total Cost"
          value={fmtMoney(totals.totalCostAvg)}
          highlight
        />
        <StatCard
          icon={<TrendingDown className="w-4 h-4" />}
          label="Bulk Pull Savings"
          value={fmtHours(totals.bulkSavingsHours ?? 0)}
          sub="hours saved vs. pulling each cable solo"
        />
      </div>
      {/* Runs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Cable Runs</CardTitle>
          <Button size="sm" onClick={openNewRun} data-testid="button-add-run">
            <Plus className="w-4 h-4 mr-1.5" /> Add Run
          </Button>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No runs yet. Add the first cable run for this estimate.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="h-8 px-2 whitespace-nowrap">Label</TableHead>
                    <TableHead className="h-8 px-2 whitespace-nowrap">Cable Type</TableHead>
                    <TableHead className="h-8 px-2 whitespace-nowrap">Description</TableHead>
                    <TableHead className="h-8 px-2 text-right whitespace-nowrap">Cables</TableHead>
                    <TableHead className="h-8 px-2 text-right whitespace-nowrap">Length</TableHead>
                    <TableHead className="h-8 px-2 whitespace-nowrap">Ceiling</TableHead>
                    <TableHead className="h-8 px-2 whitespace-nowrap">Pathway Complexity</TableHead>
                    <TableHead className="h-8 px-2 text-right whitespace-nowrap">Bulk</TableHead>
                    <TableHead className="h-8 px-2 text-right whitespace-nowrap">Condition</TableHead>
                    <TableHead className="h-8 px-2 text-right whitespace-nowrap">Pull h</TableHead>
                    <TableHead className="h-8 px-2 text-right whitespace-nowrap">Term h</TableHead>
                    <TableHead className="h-8 px-2 text-right whitespace-nowrap">Total h</TableHead>
                    <TableHead className="h-8 px-2 text-right whitespace-nowrap">Cost</TableHead>
                    <TableHead className="h-8 px-1 w-[64px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((r, i) => (
                    <TableRow
                      key={r.runId ?? i}
                      data-testid={`row-run-${r.runId}`}
                    >
                      <TableCell className="px-2 py-1.5 font-medium whitespace-nowrap">
                        {r.label}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 whitespace-nowrap">
                        {labelFor(cableTypes, r.cableType)}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-muted-foreground max-w-[200px] whitespace-normal leading-snug">
                        {r.description || <span className="opacity-50">—</span>}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-mono whitespace-nowrap">
                        {r.numCables}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-mono whitespace-nowrap">
                        {r.lengthFt} ft
                      </TableCell>
                      <TableCell className="px-2 py-1.5 whitespace-nowrap">
                        {labelFor(CEILING_TYPES, r.ceilingType)}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 whitespace-nowrap">
                        {labelFor(PATHWAY_LEVELS, r.pathwayComplexity)}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right whitespace-nowrap">
                        <Badge
                          variant={r.bulkFactor > 1 ? "default" : "outline"}
                          className="font-mono px-1.5 py-0 text-[10px]"
                        >
                          {r.bulkFactor.toFixed(3)}×
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right whitespace-nowrap">
                        <Badge
                          variant={
                            r.conditionMultiplier > 1 ? "default" : "outline"
                          }
                          className="font-mono px-1.5 py-0 text-[10px]"
                        >
                          {r.conditionMultiplier.toFixed(3)}×
                        </Badge>
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {(r.pullHoursPerCable * r.numCables).toFixed(2)}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {(r.terminationHoursPerCable * r.numCables).toFixed(2)}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-mono font-medium whitespace-nowrap">
                        {r.runHoursAvg.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-mono font-medium whitespace-nowrap">
                        {fmtMoney(r.runCostAvg)}
                      </TableCell>
                      <TableCell className="px-1 py-1.5">
                        <div className="flex gap-0.5 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => openEditRun(r)}
                            data-testid={`button-edit-run-${r.runId}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              r.runId && deleteRun.mutate({ id: r.runId })
                            }
                            data-testid={`button-delete-run-${r.runId}`}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Task Breakdown & Range Table */}
      {runs.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Task Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead className="text-right">% of Effort</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {totals.taskBreakdown.map((t) => (
                    <TableRow key={t.task}>
                      <TableCell>{t.task}</TableCell>
                      <TableCell className="text-right font-mono">
                        {(t.percent * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {t.hoursAvg.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {fmtMoney(t.costAvg)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      )}
      <MaterialsCard
        scope="cabling"
        estimateId={estimate.id}
        hardwareItems={hardwareItems}
        materials={materials}
        projectTotal={projectTotal}
        laborTotalLabel="Labor (avg)"
        laborTotalValue={totals.totalCostAvg}
        catalog={catalog}
      />
      <CablingFormulaExplainer />
      {/* Edit context dialog */}
      <Dialog open={editingContext} onOpenChange={setEditingContext}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Estimate Context</DialogTitle>
          </DialogHeader>
          <EstimateFormFields form={contextForm} setForm={setContextForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContext(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateEstimate.mutate({
                  id: estimate.id,
                  data: {
                    ...contextForm,
                    notes: contextForm.notes || undefined,
                  },
                })
              }
              data-testid="button-save-context"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Run dialog */}
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRunId !== null ? "Edit Run" : "Add Cable Run"}
            </DialogTitle>
            <DialogDescription>
              Pulling multiple cables together reduces per-cable pull time.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="run-label">Run Label</Label>
              <Input
                id="run-label"
                value={runForm.label}
                onChange={(e) =>
                  setRunForm({ ...runForm, label: e.target.value })
                }
                placeholder="e.g. Floor 3 Workstations"
                data-testid="input-run-label"
              />
            </div>
            <div>
              <Label htmlFor="run-description">Description (optional)</Label>
              <Textarea
                id="run-description"
                rows={2}
                value={runForm.description ?? ""}
                onChange={(e) =>
                  setRunForm({ ...runForm, description: e.target.value })
                }
                placeholder="e.g. Plenum-rated Cat6, blue jacket, manufacturer X"
                data-testid="input-run-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cable Type</Label>
                <Select
                  value={runForm.cableType}
                  onValueChange={(v) =>
                    setRunForm({ ...runForm, cableType: v as RunForm["cableType"] })
                  }
                >
                  <SelectTrigger data-testid="select-cable-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cableTypes.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="run-num"># of Cables in this Pull</Label>
                <Input
                  id="run-num"
                  type="number"
                  min={1}
                  value={runForm.numCables}
                  onChange={(e) =>
                    setRunForm({
                      ...runForm,
                      numCables: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  data-testid="input-num-cables"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bulk factor = 1 + α × ln(n) — pulling more cables is harder
                </p>
              </div>
              {runForm.cableType === "fiber" && (
                <div>
                  <Label>Fiber Strands</Label>
                  <Select
                    value={String(runForm.fiberStrands ?? 1)}
                    onValueChange={(v) =>
                      setRunForm({ ...runForm, fiberStrands: Number(v) })
                    }
                  >
                    <SelectTrigger data-testid="select-fiber-strands">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Each strand is terminated separately
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="run-len">Avg Length (ft)</Label>
                <Input
                  id="run-len"
                  type="number"
                  min={1}
                  value={runForm.lengthFt}
                  onChange={(e) =>
                    setRunForm({
                      ...runForm,
                      lengthFt: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  data-testid="input-length"
                />
              </div>
              <div>
                <Label>Ceiling Type</Label>
                <Select
                  value={runForm.ceilingType}
                  onValueChange={(v) =>
                    setRunForm({ ...runForm, ceilingType: v as RunForm["ceilingType"] })
                  }
                >
                  <SelectTrigger data-testid="select-ceiling">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CEILING_TYPES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Pathway Complexity</Label>
                <Select
                  value={runForm.pathwayComplexity}
                  onValueChange={(v) =>
                    setRunForm({ ...runForm, pathwayComplexity: v as RunForm["pathwayComplexity"] })
                  }
                >
                  <SelectTrigger data-testid="select-pathway">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PATHWAY_LEVELS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitRun}
              disabled={!runForm.label.trim()}
              data-testid="button-save-run"
            >
              {editingRunId !== null ? "Save Changes" : "Add Run"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CablingFormulaExplainer() {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" />
          How Each Cable Run Is Estimated
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Every value in the Rate Editor feeds directly into these formulas.
          All times convert to hours for the final output.
        </p>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Step 1 — Condition Multiplier
          </p>
          <p className="text-muted-foreground text-xs">
            Condition Multiplier = Install Type × Ceiling Type × Pathway
            Complexity × Building Type × Environment × Skill Level. Each
            factor comes from the matching section in the Rate Editor, and a
            value of 1.0 means no adjustment.
          </p>
          <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs leading-relaxed">
            conditionMult = installType × ceiling × pathway × building ×
            environment × skill
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Step 2 — Bulk Factor
          </p>
          <p className="text-muted-foreground text-xs">
            Bulk Factor = 1 + Alpha × ln(Number of Cables in the Run).
            Pulling more cables together is HARDER (friction, weight,
            jamming), so the factor grows with cable count using a
            logarithmic curve with diminishing marginal difficulty. With the
            default α = 0.15: a solo pull (1 cable) gives 1.000× (baseline);
            12 cables → ≈ 1.373×; 24 cables → ≈ 1.477×. Termination is
            never affected by the bulk factor.
          </p>
          <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs leading-relaxed">
            bulkFactor = 1 + α × ln(numCables)
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Step 3 — Pull Hours per Cable Run
          </p>
          <p className="text-muted-foreground text-xs">
            Pull Hours = (Pull Minutes per 10 ft ÷ 60) × (Length of Run in
            Feet ÷ 10) × Condition Multiplier × Bulk Factor. The crew makes
            one bulk pass for the whole bundle, so pull time does NOT
            multiply by the number of cables — the bulk factor already
            captures the cable count's contribution to that single pass.
          </p>
          <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs leading-relaxed">
            pullHrs = (pullMin10ft ÷ 60) × (lengthFt ÷ 10) × conditionMult ×
            bulkFactor
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Step 4 — Termination Hours per Cable Run
          </p>
          <p className="text-muted-foreground text-xs">
            Termination Hours = (Termination Minutes per End × 2 ends ÷ 60) ×
            Condition Multiplier × Number of Cables. Every cable is
            terminated at both ends, and termination is never bulk-discounted
            — it scales only with cable count and the condition multiplier.
          </p>
          <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs leading-relaxed">
            termHrs = (termMinPerEnd × 2 ends) ÷ 60 × conditionMult × numCables
          </div>
        </div>

        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Step 5 — Total Run Hours
          </p>
          <p className="text-muted-foreground text-xs">
            Total Run Hours = Pull Hours + Termination Hours. Run Cost =
            Total Run Hours × Hourly Rate. Totals across all runs are summed
            for the estimate's overall hours and cost.
          </p>
          <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs leading-relaxed space-y-0.5">
            <div>runHrs = pullHrs + termHrs</div>
            <div>runCost = runHrs × hourlyRate</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary" : ""}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
          {icon}
          {label}
        </div>
        <div
          className={`text-2xl font-bold mt-2 ${highlight ? "text-primary" : ""}`}
        >
          {value}
        </div>
        {sub && (
          <div className="text-xs text-muted-foreground mt-1">{sub}</div>
        )}
      </CardContent>
    </Card>
  );
}
