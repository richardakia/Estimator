import { useMemo, useState } from "react";
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
import { labelFor } from "@/lib/options";
import {
  PATHWAY_TYPES,
  PATHWAY_CATEGORIES,
  MOUNTING_HEIGHTS,
  PATHWAY_CEILING_TYPES,
  CABLE_FILL_LEVELS,
  BEND_LABOR_HRS,
  BEND_MATERIAL_COST,
  PENETRATION_LABOR_HRS,
  PENETRATION_MATERIAL_COST,
  calculatePathwaySegment,
  type PathwaySegmentInput,
} from "@/lib/pathwayConfig";

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `seg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_SEGMENT: Omit<PathwaySegmentInput, "id"> = {
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

interface PathwayDraft extends Omit<PathwaySegmentInput, "id"> {
  id: string | null;
}

const DEFAULT_DRAFT: PathwayDraft = { ...DEFAULT_SEGMENT, id: null };

export default function Pathways() {
  const [hourlyRate, setHourlyRate] = useState(85);
  const [segments, setSegments] = useState<PathwaySegmentInput[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<PathwayDraft>(DEFAULT_DRAFT);

  const openAdd = () => {
    setDraft({
      ...DEFAULT_DRAFT,
      label: `Segment ${segments.length + 1}`,
    });
    setDialogOpen(true);
  };

  const openEdit = (s: PathwaySegmentInput) => {
    setDraft({ ...s });
    setDialogOpen(true);
  };

  const submitDraft = () => {
    if (draft.id) {
      setSegments((prev) =>
        prev.map((s) =>
          s.id === draft.id ? ({ ...draft, id: draft.id } as PathwaySegmentInput) : s,
        ),
      );
    } else {
      setSegments((prev) => [...prev, { ...draft, id: newId() }]);
    }
    setDialogOpen(false);
  };

  const removeSegment = (id: string) =>
    setSegments((prev) => prev.filter((s) => s.id !== id));

  const computed = useMemo(
    () =>
      segments.map((s) => ({
        segment: s,
        result: calculatePathwaySegment(s, hourlyRate),
      })),
    [segments, hourlyRate],
  );

  const totals = useMemo(() => {
    const t = computed.reduce(
      (acc, { result }) => ({
        labor: acc.labor + result.totalLaborHrs,
        material: acc.material + result.totalMaterialCost,
        laborCost: acc.laborCost + result.laborCost,
        cost: acc.cost + result.totalCost,
        fasteners: acc.fasteners + result.fastenerCount,
      }),
      { labor: 0, material: 0, laborCost: 0, cost: 0, fasteners: 0 },
    );
    const lengthFt = segments.reduce((sum, s) => sum + s.lengthFt, 0);
    return { ...t, lengthFt };
  }, [computed, segments]);

  const previewType = PATHWAY_TYPES.find((p) => p.value === draft.pathwayType);
  const previewLength = Math.max(0, draft.lengthFt);
  const previewFastenerCount =
    previewType && previewType.fastenerSpacingFt > 0 && previewLength > 0
      ? Math.ceil(previewLength / previewType.fastenerSpacingFt)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <RouteIcon className="w-7 h-7" /> Pathway Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Estimate labor, pathway material, and fastening hardware for cable
            tray, conduit, J-hooks, and other support systems.
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <Label className="text-xs">Hourly Labor Rate</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-muted-foreground text-sm">$</span>
              <Input
                type="number"
                min={0}
                value={hourlyRate}
                onChange={(e) =>
                  setHourlyRate(Math.max(0, Number(e.target.value) || 0))
                }
                className="w-24"
                data-testid="input-hourly-rate"
              />
              <span className="text-muted-foreground text-sm">/hr</span>
            </div>
          </div>
          <Button onClick={openAdd} data-testid="button-add-segment">
            <Plus className="w-4 h-4 mr-2" /> Add Segment
          </Button>
        </div>
      </div>

      {/* Formula explainer */}
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
            <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs">
              pathwayLaborHrs = (laborMinPerFt × length ÷ 60) × heightMult × ceilingMult × fillLaborMult
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Step 2 — Fastening Hardware</p>
            <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs space-y-0.5">
              <div>fastenerCount = ceil(length ÷ fastenerSpacingFt)</div>
              <div>fastenerLaborHrs = (fastenerCount × fastenerLaborMinEach ÷ 60) × heightMult</div>
              <div>fastenerMaterialCost = fastenerCount × fastenerCostEach</div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Step 3 — Bends & Penetrations</p>
            <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs space-y-0.5">
              <div>bendHrs = bends × {BEND_LABOR_HRS} × heightMult&nbsp;&nbsp;|&nbsp;&nbsp;bendMaterial = bends × ${BEND_MATERIAL_COST}</div>
              <div>penHrs = penetrations × {PENETRATION_LABOR_HRS}&nbsp;&nbsp;|&nbsp;&nbsp;penMaterial = penetrations × ${PENETRATION_MATERIAL_COST}</div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Step 4 — Material Cost</p>
            <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs">
              pathwayMaterial = matCostPerFt × length × fillMaterialMult
            </div>
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Step 5 — Segment Total</p>
            <div className="rounded-md bg-muted/60 px-4 py-2 font-mono text-xs space-y-0.5">
              <div>totalLaborHrs = pathwayLaborHrs + fastenerLaborHrs + bendHrs + penHrs</div>
              <div>totalMaterial = pathwayMaterial + fastenerMaterial + bendMaterial + penMaterial</div>
              <div>totalCost = (totalLaborHrs × hourlyRate) + totalMaterial</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      {segments.length > 0 && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">Total Length</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">{totals.lengthFt.toLocaleString()} ft</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">Labor Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">{totals.labor.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">Labor Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">{fmtMoney(totals.laborCost)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">Material Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono">{fmtMoney(totals.material)}</p>
              <p className="text-xs text-muted-foreground">{totals.fasteners} fasteners</p>
            </CardContent>
          </Card>
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-mono text-primary">{fmtMoney(totals.cost)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Segments table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pathway Segments</CardTitle>
        </CardHeader>
        <CardContent>
          {segments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RouteIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No pathway segments yet.</p>
              <p className="text-sm mt-1">
                Click <strong>Add Segment</strong> to start building your pathway estimate.
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
                  {computed.map(({ segment: s, result }) => {
                    const t = PATHWAY_TYPES.find((p) => p.value === s.pathwayType);
                    const isPerEach = !!t?.perEach;
                    return (
                    <TableRow key={s.id} data-testid={`row-segment-${s.id}`}>
                      <TableCell className="font-medium">{s.label}</TableCell>
                      <TableCell>{labelFor(PATHWAY_TYPES, s.pathwayType)}</TableCell>
                      <TableCell className="text-right">
                        {s.lengthFt} {isPerEach ? "ea" : "ft"}
                      </TableCell>
                      <TableCell>{labelFor(MOUNTING_HEIGHTS, s.mountingHeight)}</TableCell>
                      <TableCell>
                        {isPerEach ? "—" : labelFor(PATHWAY_CEILING_TYPES, s.ceilingType)}
                      </TableCell>
                      <TableCell>
                        {isPerEach ? "—" : labelFor(CABLE_FILL_LEVELS, s.cableFill)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isPerEach ? "—" : s.bends}
                      </TableCell>
                      <TableCell className="text-right">
                        {isPerEach ? "—" : s.penetrations}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {isPerEach ? "—" : result.fastenerCount}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {result.totalLaborHrs.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {fmtMoney(result.totalMaterialCost)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {fmtMoney(result.totalCost)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {fmtMoney(result.perFtCost)}
                        <span className="text-[10px] ml-1">{isPerEach ? "/ea" : "/ft"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEdit(s)}
                            data-testid={`button-edit-${s.id}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeSegment(s.id)}
                            data-testid={`button-delete-${s.id}`}
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

      {/* Add / Edit Segment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {draft.id ? "Edit Pathway Segment" : "Add Pathway Segment"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="seg-label">Label</Label>
              <Input
                id="seg-label"
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="e.g. IDF-A backbone tray"
                data-testid="input-segment-label"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={previewType?.category ?? "continuous"}
                onValueChange={(v) => {
                  const firstInCat = PATHWAY_TYPES.find((t) => t.category === v);
                  if (firstInCat) {
                    setDraft({ ...draft, pathwayType: firstInCat.value });
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
                value={draft.pathwayType}
                onValueChange={(v) => setDraft({ ...draft, pathwayType: v })}
              >
                <SelectTrigger data-testid="select-pathway-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PATHWAY_TYPES.filter(
                    (t) => t.category === (previewType?.category ?? "continuous"),
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
                {previewType?.perEach ? "# of Penetrations" : "Length (linear ft)"}
              </Label>
              <Input
                id="seg-length"
                type="number"
                min={0}
                value={draft.lengthFt}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    lengthFt: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                data-testid="input-segment-length"
              />
              {previewType && previewType.fastenerSpacingFt > 0 && previewLength > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Auto: {previewFastenerCount} fasteners (one per {previewType.fastenerSpacingFt} ft)
                </p>
              )}
            </div>

            <div>
              <Label>Mounting Height</Label>
              <Select
                value={draft.mountingHeight}
                onValueChange={(v) => setDraft({ ...draft, mountingHeight: v })}
              >
                <SelectTrigger data-testid="select-mounting-height">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOUNTING_HEIGHTS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label} ({h.multiplier.toFixed(2)}×)
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
                    value={draft.ceilingType}
                    onValueChange={(v) => setDraft({ ...draft, ceilingType: v })}
                  >
                    <SelectTrigger data-testid="select-ceiling-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PATHWAY_CEILING_TYPES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label} ({c.multiplier.toFixed(2)}×)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cable Fill</Label>
                  <Select
                    value={draft.cableFill}
                    onValueChange={(v) => setDraft({ ...draft, cableFill: v })}
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
                    value={draft.bends}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        bends: Math.min(999, Math.max(0, Number(e.target.value) || 0)),
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
                    value={draft.penetrations}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
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
                Sleeves and slots are estimated per each. Ceiling type, cable fill,
                bends, and separate penetrations don't apply — each sleeve already
                includes the firestop and core-drilling effort.
              </div>
            )}

            <div className="col-span-2">
              <Label htmlFor="seg-notes">Notes</Label>
              <Textarea
                id="seg-notes"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                rows={2}
                placeholder="Routing details, tray width, special requirements…"
                data-testid="input-notes"
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
                      { ...draft, id: "preview" } as PathwaySegmentInput,
                      hourlyRate,
                    );
                    return (
                      <>
                        <Badge variant="outline" className="mr-2 font-mono">
                          {preview.totalLaborHrs.toFixed(1)} hrs
                        </Badge>
                        <Badge variant="outline" className="mr-2 font-mono">
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitDraft} data-testid="button-save-segment">
              {draft.id ? "Save Changes" : "Add Segment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
