import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateCablingHardwareItem,
  useUpdateCablingHardwareItem,
  useDeleteCablingHardwareItem,
  useCreatePathwayHardwareItem,
  useUpdatePathwayHardwareItem,
  useDeletePathwayHardwareItem,
} from "@workspace/api-client-react";
import type {
  HardwareItem,
  MaterialBreakdown,
  HardwareCatalogItem,
  CreateHardwareItemBody,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { CABLE_TYPES, labelFor } from "@/lib/options";

const fmtMoney = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  scope: "cabling" | "pathway";
  estimateId: number;
  hardwareItems: HardwareItem[];
  materials: MaterialBreakdown;
  projectTotal: number;
  laborTotalLabel: string;
  laborTotalValue: number;
  catalog: HardwareCatalogItem[];
}

interface FormState {
  catalogKey: string;
  name: string;
  quantity: number;
  unitCost: number;
  unit: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  catalogKey: "",
  name: "",
  quantity: 1,
  unitCost: 0,
  unit: "ea",
  notes: "",
};

export function MaterialsCard({
  scope,
  estimateId,
  hardwareItems,
  materials,
  projectTotal,
  laborTotalLabel,
  laborTotalValue,
  catalog,
}: Props) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const detailKey =
    scope === "cabling"
      ? [`/api/estimates/${estimateId}`]
      : [`/api/pathway-estimates/${estimateId}`];
  const listKey =
    scope === "cabling"
      ? ["/api/estimates"]
      : ["/api/pathway-estimates"];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: detailKey });
    queryClient.invalidateQueries({ queryKey: listKey });
  };

  const createCabling = useCreateCablingHardwareItem({
    mutation: { onSuccess: invalidate },
  });
  const updateCabling = useUpdateCablingHardwareItem({
    mutation: { onSuccess: invalidate },
  });
  const deleteCabling = useDeleteCablingHardwareItem({
    mutation: { onSuccess: invalidate },
  });
  const createPathway = useCreatePathwayHardwareItem({
    mutation: { onSuccess: invalidate },
  });
  const updatePathway = useUpdatePathwayHardwareItem({
    mutation: { onSuccess: invalidate },
  });
  const deletePathway = useDeletePathwayHardwareItem({
    mutation: { onSuccess: invalidate },
  });

  const isPending =
    createCabling.isPending ||
    updateCabling.isPending ||
    createPathway.isPending ||
    updatePathway.isPending;

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (item: HardwareItem) => {
    setEditingId(item.id);
    setForm({
      catalogKey: item.catalogKey ?? "",
      name: item.name,
      quantity: item.quantity,
      unitCost: item.unitCost,
      unit: item.unit ?? "",
      notes: item.notes ?? "",
    });
    setDialogOpen(true);
  };

  const onPickCatalog = (value: string) => {
    if (value === "__custom__") {
      setForm({ ...form, catalogKey: "" });
      return;
    }
    const found = catalog.find((c) => c.value === value);
    if (!found) return;
    setForm({
      ...form,
      catalogKey: found.value,
      name: found.label,
      unitCost: found.unitCost,
      unit: found.unit ?? form.unit,
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim() || form.quantity <= 0) return;
    const body: CreateHardwareItemBody = {
      catalogKey: form.catalogKey || null,
      name: form.name.trim(),
      quantity: form.quantity,
      unitCost: form.unitCost,
      unit: form.unit?.trim() || null,
      notes: form.notes?.trim() || null,
    };

    const onDone = () => setDialogOpen(false);

    if (editingId !== null) {
      if (scope === "cabling") {
        updateCabling.mutate({ id: editingId, data: body }, { onSuccess: onDone });
      } else {
        updatePathway.mutate({ id: editingId, data: body }, { onSuccess: onDone });
      }
    } else {
      if (scope === "cabling") {
        createCabling.mutate({ id: estimateId, data: body }, { onSuccess: onDone });
      } else {
        createPathway.mutate({ id: estimateId, data: body }, { onSuccess: onDone });
      }
    }
  };

  const handleDelete = (id: number) => {
    if (scope === "cabling") {
      deleteCabling.mutate({ id });
    } else {
      deletePathway.mutate({ id });
    }
  };

  const cableTypeLabel = (key: string) => {
    const built = labelFor(CABLE_TYPES, key);
    return built === key ? key : built;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Materials & Hardware
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {scope === "cabling"
              ? "Cable + termination material auto-priced from each run; add hardware/parts below."
              : "Pathway material auto-priced from each segment; add hardware/parts below."}
            {" "}Waste {materials.wastePercent.toFixed(1)}% on cable, markup{" "}
            {materials.markupPercent.toFixed(1)}% on subtotal.
          </p>
        </div>
        <Button size="sm" onClick={openAdd} data-testid={`button-add-hardware-${scope}`}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Item
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-computed cable + termination (cabling only) */}
        {scope === "cabling" && materials.cableLines.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
              Cable Material
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cable Type</TableHead>
                  <TableHead className="text-right">Total Ft</TableHead>
                  <TableHead className="text-right">$ / ft</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.cableLines.map((l) => (
                  <TableRow key={l.cableType}>
                    <TableCell>{cableTypeLabel(l.cableType)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {l.totalLengthFt.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${l.costPerFt.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fmtMoney(l.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {scope === "cabling" && materials.terminationLines.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
              Termination Hardware
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cable Type</TableHead>
                  <TableHead className="text-right">Ends</TableHead>
                  <TableHead className="text-right">$ / end</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.terminationLines.map((l) => (
                  <TableRow key={l.cableType}>
                    <TableCell>{cableTypeLabel(l.cableType)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {l.totalEnds}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${l.costPerEnd.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fmtMoney(l.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Hardware items */}
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
            Hardware / Parts
          </p>
          {hardwareItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-3">
              No hardware items yet. Click <strong>Add Item</strong> to add
              parts from the catalog or a one-off.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit $</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hardwareItems.map((h) => (
                  <TableRow key={h.id} data-testid={`row-hardware-${h.id}`}>
                    <TableCell>
                      <div className="font-medium">{h.name}</div>
                      {h.notes && (
                        <div className="text-xs text-muted-foreground">
                          {h.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {h.quantity}
                      {h.unit ? ` ${h.unit}` : ""}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fmtMoney(h.unitCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {fmtMoney(h.lineTotal)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(h)}
                          data-testid={`button-edit-hardware-${h.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDelete(h.id)}
                          data-testid={`button-delete-hardware-${h.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Summary */}
        <div className="rounded-md border bg-muted/30 p-4 space-y-1 font-mono text-sm">
          {scope === "cabling" ? (
            <>
              <Row label="Cable subtotal" value={materials.cableSubtotal} />
              <Row
                label={`Cable waste (${materials.wastePercent.toFixed(1)}%)`}
                value={materials.cableWasteAmount}
              />
              <Row
                label="Termination hardware"
                value={materials.terminationSubtotal}
              />
              <Row label="Hardware items" value={materials.hardwareSubtotal} />
            </>
          ) : (
            <>
              <Row label="Pathway material" value={materials.pathwaySubtotal} />
              <Row label="Hardware items" value={materials.hardwareSubtotal} />
            </>
          )}
          <Row label="Materials subtotal" value={materials.subtotal} bold />
          <Row
            label={`Markup (${materials.markupPercent.toFixed(1)}%)`}
            value={materials.markupAmount}
          />
          <Row label="Materials total" value={materials.total} bold />
          <div className="border-t my-2" />
          <Row label={laborTotalLabel} value={laborTotalValue} />
          <Row
            label="Project total"
            value={projectTotal}
            bold
            highlight
            testId={`text-project-total-${scope}`}
          />
        </div>
      </CardContent>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) {
            setEditingId(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId !== null ? "Edit Hardware Item" : "Add Hardware Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>From Catalog</Label>
              <Select
                value={form.catalogKey || "__custom__"}
                onValueChange={onPickCatalog}
              >
                <SelectTrigger data-testid="select-hardware-catalog">
                  <SelectValue placeholder="Pick from catalog or custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__custom__">Custom (one-off)</SelectItem>
                  {catalog.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label} — ${c.unitCost.toFixed(2)}
                      {c.unit ? ` / ${c.unit}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 24-Port Patch Panel"
                data-testid="input-hardware-name"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label>Qty</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantity: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  data-testid="input-hardware-qty"
                />
              </div>
              <div>
                <Label>Unit $</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.unitCost}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unitCost: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  data-testid="input-hardware-unit-cost"
                />
              </div>
              <div>
                <Label>Unit</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="ea"
                  data-testid="input-hardware-unit"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                data-testid="input-hardware-notes"
              />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Line total: {fmtMoney(form.quantity * form.unitCost)}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || !form.name.trim() || form.quantity <= 0}
              data-testid="button-save-hardware"
            >
              {editingId !== null ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
  testId,
}: {
  label: string;
  value: number;
  bold?: boolean;
  highlight?: boolean;
  testId?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={
          bold
            ? "font-sans font-semibold"
            : "font-sans text-muted-foreground"
        }
      >
        {label}
      </span>
      <span
        data-testid={testId}
        className={
          highlight
            ? "text-primary font-bold text-base"
            : bold
              ? "font-semibold"
              : ""
        }
      >
        {fmtMoney(value)}
      </span>
    </div>
  );
}
