import { useEffect, useMemo, useRef, useState } from "react";
import {
  useGetRates,
  useListPathwayEstimates,
  useGetPathwayEstimate,
  useCreatePathwayEstimate,
  useUpdatePathwayEstimate,
  useDeletePathwayEstimate,
  useCreatePathwaySegment,
  useUpdatePathwaySegment,
  useDeletePathwaySegment,
  getGetPathwayEstimateQueryKey,
  getListPathwayEstimatesQueryKey,
} from "@workspace/api-client-react";
import type {
  CreatePathwayEstimateBody,
  CreatePathwaySegmentBody,
  PathwayEstimateDetail,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Pencil,
  Trash2,
  Route as RouteIcon,
  FlaskConical,
} from "lucide-react";
import {
  labelFor,
  INSTALL_TYPES,
  BUILDING_TYPES,
  ENVIRONMENTS,
  SKILL_LEVELS,
} from "@/lib/options";
import {
  PATHWAY_TYPES,
  PATHWAY_CATEGORIES,
  MOUNTING_HEIGHTS,
  PATHWAY_CEILING_TYPES,
  CABLE_FILL_LEVELS,
  calculatePathwaySegment,
  resolvePathwayRates,
  type PathwayRates,
  type PathwaySegmentInput,
} from "@/lib/pathwayConfig";
import { usePathwayEstimates } from "@/lib/pathway-estimates-context";

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

type PathwayDraftBody = CreatePathwaySegmentBody & { notes: string };

const DEFAULT_SEGMENT_DRAFT: PathwayDraftBody = {
  label: "",
  pathwayType: "j_hooks",
  lengthFt: 100,
  mountingHeight: "8ft",
  ceilingType: "t_bar",
  cableFill: "medium",
  bends: 0,
  penetrations: 0,
  notes: "",
};

const DEFAULT_NEW_ESTIMATE: CreatePathwayEstimateBody = {
  name: "",
  installType: "new_install",
  buildingType: "office",
  environment: "unoccupied",
  skillLevel: "journeyman",
  hourlyRate: 85,
  notes: "",
};

function EstimateContextFields({
  form,
  setForm,
}: {
  form: CreatePathwayEstimateBody;
  setForm: (f: CreatePathwayEstimateBody) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>Install Type</Label>
        <Select
          value={form.installType}
          onValueChange={(v) =>
            setForm({
              ...form,
              installType: v as CreatePathwayEstimateBody["installType"],
            })
          }
        >
          <SelectTrigger data-testid="select-pe-install-type">
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
          onValueChange={(v) =>
            setForm({
              ...form,
              buildingType: v as CreatePathwayEstimateBody["buildingType"],
            })
          }
        >
          <SelectTrigger data-testid="select-pe-building-type">
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
          onValueChange={(v) =>
            setForm({
              ...form,
              environment: v as CreatePathwayEstimateBody["environment"],
            })
          }
        >
          <SelectTrigger data-testid="select-pe-environment">
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
          onValueChange={(v) =>
            setForm({
              ...form,
              skillLevel: v as CreatePathwayEstimateBody["skillLevel"],
            })
          }
        >
          <SelectTrigger data-testid="select-pe-skill-level">
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
    </div>
  );
}

interface RatesObj {
  hourlyRate?: number;
  pathwayTypeRates?: PathwayRates["typeRates"];
  pathwayMountingHeightMult?: PathwayRates["heightMult"];
  pathwayCeilingMult?: PathwayRates["ceilingMult"];
  pathwayCableFillMult?: PathwayRates["fillMult"];
  pathwayBendLaborHrs?: number;
  pathwayBendMaterialCost?: number;
  pathwayPenetrationLaborHrs?: number;
  pathwayPenetrationMaterialCost?: number;
}

export default function Pathways() {
  const queryClient = useQueryClient();
  const { selectedId, setSelectedId, newEstOpen, setNewEstOpen } =
    usePathwayEstimates();

  const { data: ratesData } = useGetRates();
  const ratesObj = ratesData as RatesObj | undefined;
  const ratesHourlyRate = ratesObj?.hourlyRate ?? 85;

  const pathwayRates = useMemo(
    () =>
      resolvePathwayRates({
        typeRates: ratesObj?.pathwayTypeRates,
        heightMult: ratesObj?.pathwayMountingHeightMult,
        ceilingMult: ratesObj?.pathwayCeilingMult,
        fillMult: ratesObj?.pathwayCableFillMult,
        bendLaborHrs: ratesObj?.pathwayBendLaborHrs,
        bendMaterialCost: ratesObj?.pathwayBendMaterialCost,
        penetrationLaborHrs: ratesObj?.pathwayPenetrationLaborHrs,
        penetrationMaterialCost: ratesObj?.pathwayPenetrationMaterialCost,
      }),
    [ratesObj],
  );

  const [newEstForm, setNewEstForm] =
    useState<CreatePathwayEstimateBody>(DEFAULT_NEW_ESTIMATE);

  // Mirror estimator.tsx race-handling: seed the dialog's hourly rate from
  // /api/rates when opened, and re-sync once if rates resolve later.
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

  const { data: detail } = useGetPathwayEstimate(selectedId ?? 0, {
    query: {
      enabled: selectedId !== null,
      queryKey: getGetPathwayEstimateQueryKey(selectedId ?? 0),
    },
  });

  const createEstimate = useCreatePathwayEstimate({
    mutation: {
      onSuccess: (created) => {
        queryClient.invalidateQueries({
          queryKey: getListPathwayEstimatesQueryKey(),
        });
        setSelectedId(created.id);
        setNewEstOpen(false);
        setNewEstForm({ ...DEFAULT_NEW_ESTIMATE, hourlyRate: ratesHourlyRate });
      },
    },
  });

  const deleteEstimate = useDeletePathwayEstimate({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListPathwayEstimatesQueryKey(),
        });
        setSelectedId(null);
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <RouteIcon className="w-7 h-7" /> Pathway Calculator
        </h1>
        <p className="text-muted-foreground mt-1">
          Estimate labor, pathway material, and fastening hardware for cable
          tray, conduit, J-hooks, and other support systems. Pick a saved
          estimate from the sidebar or create a new one.
        </p>
      </div>

      {!selectedId ? (
        <>
          <Card>
            <CardContent className="py-20 text-center text-muted-foreground">
              <RouteIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="mb-4">
                Choose a pathway estimate from the sidebar dropdown, or start a
                new one.
              </p>
              <Button
                onClick={() => setNewEstOpen(true)}
                data-testid="button-new-pathway-estimate"
              >
                <Plus className="w-4 h-4 mr-2" /> New Pathway Estimate
              </Button>
            </CardContent>
          </Card>
          <FormulaExplainer rates={pathwayRates} />
        </>
      ) : detail ? (
        <PathwayEstimateView
          detail={detail}
          pathwayRates={pathwayRates}
          onDelete={() =>
            deleteEstimate.mutate({ id: detail.estimate.id })
          }
        />
      ) : (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      )}

      {/* New Estimate Dialog */}
      <Dialog open={newEstOpen} onOpenChange={setNewEstOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Pathway Estimate</DialogTitle>
            <DialogDescription>
              Set the project context, name, and hourly rate. You can add
              segments after.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="new-pe-name">Estimate Name</Label>
              <Input
                id="new-pe-name"
                value={newEstForm.name}
                onChange={(e) =>
                  setNewEstForm({ ...newEstForm, name: e.target.value })
                }
                placeholder="e.g. Acme HQ — Riser Pathways"
                data-testid="input-new-pathway-estimate-name"
              />
            </div>
            <EstimateContextFields form={newEstForm} setForm={setNewEstForm} />
            <div>
              <Label htmlFor="new-pe-rate">Hourly Rate ($)</Label>
              <Input
                id="new-pe-rate"
                type="number"
                min={0}
                value={newEstForm.hourlyRate}
                onChange={(e) =>
                  setNewEstForm({
                    ...newEstForm,
                    hourlyRate: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                data-testid="input-new-pathway-estimate-rate"
              />
            </div>
            <div>
              <Label htmlFor="new-pe-notes">Notes</Label>
              <Textarea
                id="new-pe-notes"
                rows={2}
                value={newEstForm.notes ?? ""}
                onChange={(e) =>
                  setNewEstForm({ ...newEstForm, notes: e.target.value })
                }
                placeholder="Optional context for this pathway plan…"
                data-testid="input-new-pathway-estimate-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewEstOpen(false)}
              data-testid="button-cancel-new-pathway-estimate"
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                createEstimate.mutate({
                  data: {
                    name: newEstForm.name,
                    installType: newEstForm.installType,
                    buildingType: newEstForm.buildingType,
                    environment: newEstForm.environment,
                    skillLevel: newEstForm.skillLevel,
                    hourlyRate: newEstForm.hourlyRate,
                    notes: newEstForm.notes || undefined,
                  },
                })
              }
              disabled={
                !newEstForm.name.trim() || createEstimate.isPending
              }
              data-testid="button-save-new-pathway-estimate"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FormulaExplainer({ rates }: { rates: PathwayRates }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-primary" />
          How Each Pathway Segment Is Estimated
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1">
          <p className="font-semibold">Step 1 — Pathway Labor</p>
          <p className="text-muted-foreground text-xs">
            Pathway Labor Hours = (Labor Minutes per Foot × Length of Pathway
            ÷ 60) × Height Multiplier × Ceiling Multiplier × Cable Fill Labor
            Multiplier.
          </p>
          <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs">
            pathwayLaborHrs = (laborMinPerFt × length ÷ 60) × heightMult ×
            ceilingMult × fillLaborMult
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Step 2 — Fastening Hardware</p>
          <p className="text-muted-foreground text-xs">
            Fastener Count = round up (Length of Pathway ÷ Spacing Between
            Fasteners). Fastener Labor Hours = (Fastener Count × Labor Minutes
            per Fastener ÷ 60) × Height Multiplier. Fastener Material Cost =
            Fastener Count × Cost per Fastener.
          </p>
          <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs space-y-0.5">
            <div>fastenerCount = ceil(length ÷ fastenerSpacingFt)</div>
            <div>
              fastenerLaborHrs = (fastenerCount × fastenerLaborMinEach ÷ 60) ×
              heightMult
            </div>
            <div>fastenerMaterialCost = fastenerCount × fastenerCostEach</div>
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Step 3 — Bends & Penetrations</p>
          <p className="text-muted-foreground text-xs">
            Bend Hours = Number of Bends × Labor Hours per Bend × Height
            Multiplier, and Bend Material Cost = Number of Bends × Material
            Cost per Bend. Penetration Hours = Number of Penetrations × Labor
            Hours per Penetration, and Penetration Material Cost = Number of
            Penetrations × Material Cost per Penetration.
          </p>
          <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs space-y-0.5">
            <div>
              bendHrs = bends × {rates.bendLaborHrs} × heightMult&nbsp;&nbsp;|
              &nbsp;&nbsp;bendMaterial = bends × ${rates.bendMaterialCost}
            </div>
            <div>
              penHrs = penetrations × {rates.penetrationLaborHrs}
              &nbsp;&nbsp;|&nbsp;&nbsp;penMaterial = penetrations × $
              {rates.penetrationMaterialCost}
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Step 4 — Material Cost</p>
          <p className="text-muted-foreground text-xs">
            Pathway Material Cost = Material Cost per Foot × Length of Pathway
            × Cable Fill Material Multiplier.
          </p>
          <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs">
            pathwayMaterial = matCostPerFt × length × fillMaterialMult
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Step 5 — Segment Total</p>
          <p className="text-muted-foreground text-xs">
            Total Labor Hours = Pathway Labor Hours + Fastener Labor Hours +
            Bend Hours + Penetration Hours. Total Material Cost = Pathway
            Material + Fastener Material + Bend Material + Penetration
            Material. Total Cost = (Total Labor Hours × Hourly Rate) + Total
            Material Cost.
          </p>
          <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs space-y-0.5">
            <div>
              totalLaborHrs = pathwayLaborHrs + fastenerLaborHrs + bendHrs +
              penHrs
            </div>
            <div>
              totalMaterial = pathwayMaterial + fastenerMaterial + bendMaterial
              + penMaterial
            </div>
            <div>totalCost = (totalLaborHrs × hourlyRate) + totalMaterial</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PathwayEstimateView({
  detail,
  pathwayRates,
  onDelete,
}: {
  detail: PathwayEstimateDetail;
  pathwayRates: PathwayRates;
  onDelete: () => void;
}) {
  const queryClient = useQueryClient();
  const { estimate, segments, totals } = detail;

  const [editingEstimate, setEditingEstimate] = useState(false);
  const [estimateForm, setEstimateForm] = useState<CreatePathwayEstimateBody>({
    name: estimate.name,
    installType: estimate.installType,
    buildingType: estimate.buildingType,
    environment: estimate.environment,
    skillLevel: estimate.skillLevel,
    hourlyRate: estimate.hourlyRate,
    notes: estimate.notes ?? "",
  });

  const [segDialogOpen, setSegDialogOpen] = useState(false);
  const [editingSegmentId, setEditingSegmentId] = useState<number | null>(null);
  const [segDraft, setSegDraft] = useState<PathwayDraftBody>(
    DEFAULT_SEGMENT_DRAFT,
  );

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: getListPathwayEstimatesQueryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: getGetPathwayEstimateQueryKey(estimate.id),
    });
  };

  const updateEstimate = useUpdatePathwayEstimate({
    mutation: {
      onSuccess: () => {
        invalidate();
        setEditingEstimate(false);
      },
    },
  });

  const createSegment = useCreatePathwaySegment({
    mutation: {
      onSuccess: () => {
        invalidate();
        setSegDialogOpen(false);
        setSegDraft(DEFAULT_SEGMENT_DRAFT);
      },
    },
  });

  const updateSegment = useUpdatePathwaySegment({
    mutation: {
      onSuccess: () => {
        invalidate();
        setSegDialogOpen(false);
        setEditingSegmentId(null);
        setSegDraft(DEFAULT_SEGMENT_DRAFT);
      },
    },
  });

  const deleteSegment = useDeletePathwaySegment({
    mutation: { onSuccess: invalidate },
  });

  const openNewSegment = () => {
    setEditingSegmentId(null);
    setSegDraft({
      ...DEFAULT_SEGMENT_DRAFT,
      label: `Segment ${segments.length + 1}`,
    });
    setSegDialogOpen(true);
  };

  const openEditSegment = (s: PathwayEstimateDetail["segments"][number]) => {
    setEditingSegmentId(s.segmentId);
    setSegDraft({
      label: s.label,
      pathwayType: s.pathwayType,
      lengthFt: s.lengthFt,
      mountingHeight: s.mountingHeight,
      ceilingType: s.ceilingType,
      cableFill: s.cableFill,
      bends: s.bends,
      penetrations: s.penetrations,
      notes: s.notes ?? "",
    });
    setSegDialogOpen(true);
  };

  const submitSegment = () => {
    const body = {
      label: segDraft.label,
      pathwayType: segDraft.pathwayType,
      lengthFt: segDraft.lengthFt,
      mountingHeight: segDraft.mountingHeight,
      ceilingType: segDraft.ceilingType,
      cableFill: segDraft.cableFill,
      bends: segDraft.bends,
      penetrations: segDraft.penetrations,
      notes: segDraft.notes || undefined,
    };
    if (editingSegmentId !== null) {
      updateSegment.mutate({ id: editingSegmentId, data: body });
    } else {
      createSegment.mutate({ id: estimate.id, data: body });
    }
  };

  const previewType = PATHWAY_TYPES.find(
    (p) => p.value === segDraft.pathwayType,
  );
  const previewTypeRate = pathwayRates.typeRates[segDraft.pathwayType];
  const previewLength = Math.max(0, segDraft.lengthFt);
  const previewFastenerSpacing = previewTypeRate?.fastenerSpacingFt ?? 0;
  const previewFastenerCount =
    previewType && previewFastenerSpacing > 0 && previewLength > 0
      ? Math.ceil(previewLength / previewFastenerSpacing)
      : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle data-testid="text-pathway-estimate-name">
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
              <Badge variant="secondary">
                {totals.segmentCount} segment
                {totals.segmentCount === 1 ? "" : "s"}
              </Badge>
              <Badge variant="secondary">
                {totals.totalLengthFt.toLocaleString()} ft total
              </Badge>
            </div>
            {estimate.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                {estimate.notes}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEstimateForm({
                  name: estimate.name,
                  installType: estimate.installType,
                  buildingType: estimate.buildingType,
                  environment: estimate.environment,
                  skillLevel: estimate.skillLevel,
                  hourlyRate: estimate.hourlyRate,
                  notes: estimate.notes ?? "",
                });
                setEditingEstimate(true);
              }}
              data-testid="button-edit-pathway-estimate"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              data-testid="button-delete-pathway-estimate"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 text-destructive" /> Delete
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Totals */}
      {segments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Total Length
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">
                {totals.totalLengthFt.toLocaleString()} ft
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Labor Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">
                {totals.totalLaborHrs.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Labor Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">
                {fmtMoney(totals.totalLaborCost)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Material Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">
                {fmtMoney(totals.totalMaterialCost)}
              </p>
              <p className="text-xs text-muted-foreground">
                {totals.totalFasteners} fasteners
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">
                Total Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono text-primary">
                {fmtMoney(totals.totalCost)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Segments table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Pathway Segments</CardTitle>
          <Button
            size="sm"
            onClick={openNewSegment}
            data-testid="button-add-segment"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Segment
          </Button>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RouteIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No pathway segments yet.</p>
              <p className="text-sm mt-1">
                Click <strong>Add Segment</strong> to start building this
                pathway estimate.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Pathway Type</TableHead>
                    <TableHead className="text-right">Length</TableHead>
                    <TableHead>Height</TableHead>
                    <TableHead>Ceiling</TableHead>
                    <TableHead>Fill</TableHead>
                    <TableHead className="text-right">Bends</TableHead>
                    <TableHead className="text-right">Penetr.</TableHead>
                    <TableHead className="text-right">Fasteners</TableHead>
                    <TableHead className="text-right">Labor hrs</TableHead>
                    <TableHead className="text-right">Material</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">$/ft</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((s) => {
                    const t = PATHWAY_TYPES.find(
                      (p) => p.value === s.pathwayType,
                    );
                    const isPerEach = !!t?.perEach;
                    return (
                      <TableRow
                        key={s.segmentId}
                        data-testid={`row-segment-${s.segmentId}`}
                      >
                        <TableCell className="font-medium">{s.label}</TableCell>
                        <TableCell>
                          {labelFor(PATHWAY_TYPES, s.pathwayType)}
                        </TableCell>
                        <TableCell className="text-right">
                          {s.lengthFt} {isPerEach ? "ea" : "ft"}
                        </TableCell>
                        <TableCell>
                          {labelFor(MOUNTING_HEIGHTS, s.mountingHeight)}
                        </TableCell>
                        <TableCell>
                          {isPerEach
                            ? "—"
                            : labelFor(PATHWAY_CEILING_TYPES, s.ceilingType)}
                        </TableCell>
                        <TableCell>
                          {isPerEach
                            ? "—"
                            : labelFor(CABLE_FILL_LEVELS, s.cableFill)}
                        </TableCell>
                        <TableCell className="text-right">
                          {isPerEach ? "—" : s.bends}
                        </TableCell>
                        <TableCell className="text-right">
                          {isPerEach ? "—" : s.penetrations}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {isPerEach ? "—" : s.fastenerCount}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {s.totalLaborHrs.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {fmtMoney(s.totalMaterialCost)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {fmtMoney(s.totalCost)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {fmtMoney(s.perFtCost)}
                          <span className="text-[10px] ml-1">
                            {isPerEach ? "/ea" : "/ft"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => openEditSegment(s)}
                              data-testid={`button-edit-segment-${s.segmentId}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() =>
                                deleteSegment.mutate({ id: s.segmentId })
                              }
                              data-testid={`button-delete-segment-${s.segmentId}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FormulaExplainer rates={pathwayRates} />

      {/* Edit Estimate dialog */}
      <Dialog open={editingEstimate} onOpenChange={setEditingEstimate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pathway Estimate</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="edit-pe-name">Estimate Name</Label>
              <Input
                id="edit-pe-name"
                value={estimateForm.name}
                onChange={(e) =>
                  setEstimateForm({ ...estimateForm, name: e.target.value })
                }
                data-testid="input-edit-pathway-estimate-name"
              />
            </div>
            <EstimateContextFields
              form={estimateForm}
              setForm={setEstimateForm}
            />
            <div>
              <Label htmlFor="edit-pe-rate">Hourly Rate ($)</Label>
              <Input
                id="edit-pe-rate"
                type="number"
                min={0}
                value={estimateForm.hourlyRate}
                onChange={(e) =>
                  setEstimateForm({
                    ...estimateForm,
                    hourlyRate: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                data-testid="input-edit-pathway-estimate-rate"
              />
            </div>
            <div>
              <Label htmlFor="edit-pe-notes">Notes</Label>
              <Textarea
                id="edit-pe-notes"
                rows={2}
                value={estimateForm.notes ?? ""}
                onChange={(e) =>
                  setEstimateForm({ ...estimateForm, notes: e.target.value })
                }
                data-testid="input-edit-pathway-estimate-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingEstimate(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateEstimate.mutate({
                  id: estimate.id,
                  data: {
                    name: estimateForm.name,
                    installType: estimateForm.installType,
                    buildingType: estimateForm.buildingType,
                    environment: estimateForm.environment,
                    skillLevel: estimateForm.skillLevel,
                    hourlyRate: estimateForm.hourlyRate,
                    notes: estimateForm.notes || undefined,
                  },
                })
              }
              data-testid="button-save-pathway-estimate"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Segment Dialog */}
      <Dialog open={segDialogOpen} onOpenChange={setSegDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSegmentId !== null
                ? "Edit Pathway Segment"
                : "Add Pathway Segment"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="seg-label">Label</Label>
              <Input
                id="seg-label"
                value={segDraft.label}
                onChange={(e) =>
                  setSegDraft({ ...segDraft, label: e.target.value })
                }
                placeholder="e.g. IDF-A backbone tray"
                data-testid="input-segment-label"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={previewType?.category ?? "continuous"}
                onValueChange={(v) => {
                  const firstInCat = PATHWAY_TYPES.find(
                    (t) => t.category === v,
                  );
                  if (firstInCat) {
                    setSegDraft({
                      ...segDraft,
                      pathwayType:
                        firstInCat.value as PathwayDraftBody["pathwayType"],
                    });
                  }
                }}
              >
                <SelectTrigger data-testid="select-pathway-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATHWAY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Pathway Type</Label>
              <Select
                value={segDraft.pathwayType}
                onValueChange={(v) =>
                  setSegDraft({
                    ...segDraft,
                    pathwayType: v as PathwayDraftBody["pathwayType"],
                  })
                }
              >
                <SelectTrigger data-testid="select-pathway-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATHWAY_TYPES.filter(
                    (t) =>
                      t.category ===
                      (previewType?.category ?? "continuous"),
                  ).map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {previewType && (
                <p className="text-xs text-muted-foreground mt-1">
                  {previewType.bestFor}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="seg-length">
                {previewType?.perEach
                  ? "# of Penetrations"
                  : "Length (linear ft)"}
              </Label>
              <Input
                id="seg-length"
                type="number"
                min={0}
                value={segDraft.lengthFt}
                onChange={(e) =>
                  setSegDraft({
                    ...segDraft,
                    lengthFt: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                data-testid="input-segment-length"
              />
              {previewType &&
                previewFastenerSpacing > 0 &&
                previewLength > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto: {previewFastenerCount} fasteners (one per{" "}
                    {previewFastenerSpacing} ft)
                  </p>
                )}
            </div>

            <div>
              <Label>Mounting Height</Label>
              <Select
                value={segDraft.mountingHeight}
                onValueChange={(v) =>
                  setSegDraft({
                    ...segDraft,
                    mountingHeight: v as PathwayDraftBody["mountingHeight"],
                  })
                }
              >
                <SelectTrigger data-testid="select-mounting-height">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOUNTING_HEIGHTS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label} (
                      {(
                        pathwayRates.heightMult[h.value] ?? h.multiplier
                      ).toFixed(2)}
                      ×)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!previewType?.perEach && (
              <>
                <div>
                  <Label>Ceiling / Structure</Label>
                  <Select
                    value={segDraft.ceilingType}
                    onValueChange={(v) =>
                      setSegDraft({
                        ...segDraft,
                        ceilingType: v as PathwayDraftBody["ceilingType"],
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-ceiling-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PATHWAY_CEILING_TYPES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label} (
                          {(
                            pathwayRates.ceilingMult[c.value] ?? c.multiplier
                          ).toFixed(2)}
                          ×)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cable Fill</Label>
                  <Select
                    value={segDraft.cableFill}
                    onValueChange={(v) =>
                      setSegDraft({
                        ...segDraft,
                        cableFill: v as PathwayDraftBody["cableFill"],
                      })
                    }
                  >
                    <SelectTrigger data-testid="select-cable-fill">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CABLE_FILL_LEVELS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="seg-bends">Bends / 90° turns</Label>
                  <Input
                    id="seg-bends"
                    type="number"
                    min={0}
                    max={999}
                    value={segDraft.bends}
                    onChange={(e) =>
                      setSegDraft({
                        ...segDraft,
                        bends: Math.min(
                          999,
                          Math.max(0, Number(e.target.value) || 0),
                        ),
                      })
                    }
                    data-testid="input-bends"
                  />
                </div>

                <div>
                  <Label htmlFor="seg-pens">Wall / Floor Penetrations</Label>
                  <Input
                    id="seg-pens"
                    type="number"
                    min={0}
                    max={999}
                    value={segDraft.penetrations}
                    onChange={(e) =>
                      setSegDraft({
                        ...segDraft,
                        penetrations: Math.min(
                          999,
                          Math.max(0, Number(e.target.value) || 0),
                        ),
                      })
                    }
                    data-testid="input-penetrations"
                  />
                </div>
              </>
            )}

            {previewType?.perEach && (
              <div className="col-span-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                Sleeves and slots are estimated per each. Ceiling type, cable
                fill, bends, and separate penetrations don't apply — each
                sleeve already includes the firestop and core-drilling effort.
              </div>
            )}

            <div className="col-span-2">
              <Label htmlFor="seg-notes">Notes</Label>
              <Textarea
                id="seg-notes"
                value={segDraft.notes ?? ""}
                onChange={(e) =>
                  setSegDraft({ ...segDraft, notes: e.target.value })
                }
                rows={2}
                placeholder="Routing details, tray width, special requirements…"
                data-testid="input-segment-notes"
              />
            </div>
          </div>

          {/* Live preview */}
          {previewType && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Live preview:</span>
                <span className="font-mono">
                  {(() => {
                    const preview = calculatePathwaySegment(
                      {
                        id: "preview",
                        label: segDraft.label,
                        pathwayType: segDraft.pathwayType,
                        lengthFt: segDraft.lengthFt,
                        mountingHeight: segDraft.mountingHeight,
                        ceilingType: segDraft.ceilingType,
                        cableFill: segDraft.cableFill,
                        bends: segDraft.bends,
                        penetrations: segDraft.penetrations,
                        notes: segDraft.notes ?? "",
                      } as PathwaySegmentInput,
                      estimate.hourlyRate,
                      pathwayRates,
                    );
                    return (
                      <>
                        <Badge
                          variant="outline"
                          className="mr-2 font-mono"
                        >
                          {preview.totalLaborHrs.toFixed(1)} hrs
                        </Badge>
                        <Badge
                          variant="outline"
                          className="mr-2 font-mono"
                        >
                          {fmtMoney(preview.totalMaterialCost)} mat
                        </Badge>
                        <Badge className="font-mono">
                          {fmtMoney(preview.totalCost)} total
                        </Badge>
                      </>
                    );
                  })()}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSegDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitSegment}
              disabled={
                !segDraft.label.trim() ||
                createSegment.isPending ||
                updateSegment.isPending
              }
              data-testid="button-save-segment"
            >
              {editingSegmentId !== null ? "Save Changes" : "Add Segment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
