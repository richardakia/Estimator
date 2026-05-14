import { useState, useMemo } from "react";
import {
  useListMaterials,
  useCreateMaterial,
  useUpdateMaterial,
  useDeleteMaterial,
  useGetRates,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CABLE_TYPES } from "@/lib/options";

const CLASSIFICATIONS = [
  "Cable",
  "Connector",
  "Patch Panel",
  "Conduit / Pathway",
  "Hardware",
  "Tool",
  "Consumable",
  "Other",
] as const;

const UNITS = ["ea", "ft", "m", "box", "roll", "spool", "bag", "pkg", "pr", "set"] as const;

interface MaterialFormState {
  name: string;
  description: string;
  cost: string;
  classification: string;
  cableType: string;
  manufacturer: string;
  partNumber: string;
  unit: string;
  supplier: string;
  notes: string;
  tags: string;
  isActive: boolean;
}

const EMPTY_FORM: MaterialFormState = {
  name: "",
  description: "",
  cost: "0",
  classification: "",
  cableType: "",
  manufacturer: "",
  partNumber: "",
  unit: "ea",
  supplier: "",
  notes: "",
  tags: "",
  isActive: true,
};

type SortKey = "name" | "classification" | "manufacturer" | "cost" | "unit" | "supplier";
type SortDir = "asc" | "desc";

function fmt$(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function MaterialsEditor() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: materials = [], isLoading } = useListMaterials();
  const { data: rates } = useGetRates();

  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MaterialFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState("");

  // Build merged cable type list: built-in + any custom types from Rate Editor
  const cableTypeOptions = useMemo(() => {
    const builtIn = CABLE_TYPES.map((t) => ({ value: t.value, label: t.label }));
    const custom: { value: string; label: string }[] =
      (rates?.customCableTypes ?? []).map((ct: { value: string; label: string }) => ({
        value: ct.value,
        label: ct.label,
      }));
    // Merge, deduplicating by value
    const seen = new Set(builtIn.map((t) => t.value));
    const extras = custom.filter((t) => !seen.has(t.value));
    return [...builtIn, ...extras];
  }, [rates]);

  function cableTypeLabel(value: string): string {
    return cableTypeOptions.find((t) => t.value === value)?.label ?? value;
  }

  function setField<K extends keyof MaterialFormState>(k: K, v: MaterialFormState[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      // Clear cableType when classification changes away from Cable
      if (k === "classification" && v !== "Cable") {
        next.cableType = "";
      }
      return next;
    });
    setFormError("");
  }

  const filtered = useMemo(() => {
    let rows = [...(materials as NonNullable<typeof materials>)];
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.manufacturer ?? "").toLowerCase().includes(q) ||
          (r.partNumber ?? "").toLowerCase().includes(q) ||
          (r.supplier ?? "").toLowerCase().includes(q) ||
          (r.description ?? "").toLowerCase().includes(q),
      );
    }
    if (filterClass !== "all") {
      rows = rows.filter((r) => r.classification === filterClass);
    }
    if (filterStatus !== "all") {
      rows = rows.filter((r) => (filterStatus === "active" ? r.isActive : !r.isActive));
    }
    rows.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortKey) {
        case "name":
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case "classification":
          av = (a.classification ?? "").toLowerCase();
          bv = (b.classification ?? "").toLowerCase();
          break;
        case "manufacturer":
          av = (a.manufacturer ?? "").toLowerCase();
          bv = (b.manufacturer ?? "").toLowerCase();
          break;
        case "cost":
          av = a.cost;
          bv = b.cost;
          break;
        case "unit":
          av = (a.unit ?? "").toLowerCase();
          bv = (b.unit ?? "").toLowerCase();
          break;
        case "supplier":
          av = (a.supplier ?? "").toLowerCase();
          bv = (b.supplier ?? "").toLowerCase();
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [materials, search, filterClass, filterStatus, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown className="w-3 h-3 ml-1 text-muted-foreground" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3 ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 ml-1" />
    );
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(m: (typeof materials)[number]) {
    setEditingId(m.id);
    setForm({
      name: m.name,
      description: m.description ?? "",
      cost: String(m.cost),
      classification: m.classification ?? "",
      cableType: m.cableType ?? "",
      manufacturer: m.manufacturer ?? "",
      partNumber: m.partNumber ?? "",
      unit: m.unit ?? "ea",
      supplier: m.supplier ?? "",
      notes: m.notes ?? "",
      tags: (m.tags ?? []).join(", "),
      isActive: m.isActive,
    });
    setFormError("");
    setDialogOpen(true);
  }

  function validateForm(): boolean {
    if (!form.name.trim()) {
      setFormError("Name is required.");
      return false;
    }
    const cost = Number(form.cost);
    if (isNaN(cost) || cost < 0) {
      setFormError("Cost must be a non-negative number.");
      return false;
    }
    return true;
  }

  async function handleSave() {
    if (!validateForm()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      cost: Number(form.cost) || 0,
      classification: form.classification || null,
      cableType: form.classification === "Cable" && form.cableType ? form.cableType : null,
      manufacturer: form.manufacturer.trim() || null,
      partNumber: form.partNumber.trim() || null,
      unit: form.unit || null,
      supplier: form.supplier.trim() || null,
      notes: form.notes.trim() || null,
      tags: parseTags(form.tags).length ? parseTags(form.tags) : null,
      isActive: form.isActive,
    };

    try {
      if (editingId !== null) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast({ title: "Material updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Material added" });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      setDialogOpen(false);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId });
      await queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: "Material deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  const isBusy = createMutation.isPending || updateMutation.isPending;
  const classOptions = useMemo(() => {
    const fromData = Array.from(
      new Set(
        (materials as NonNullable<typeof materials>)
          .map((m) => m.classification)
          .filter(Boolean) as string[],
      ),
    );
    const merged = Array.from(new Set([...CLASSIFICATIONS, ...fromData])).sort();
    return merged;
  }, [materials]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Materials Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Central materials database shared by the Cabling and Pathway estimators.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-8"
                placeholder="Search name, manufacturer, part #…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch("")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Classifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classifications</SelectItem>
                  {classOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as "all" | "active" | "inactive")}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              {filtered.length} of {(materials as NonNullable<typeof materials>).length}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Materials Database</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {(materials as NonNullable<typeof materials>).length === 0
                ? 'No materials yet. Click "Add Material" to get started.'
                : "No materials match the current filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("name")}
                    >
                      <span className="inline-flex items-center">
                        Name <SortIcon k="name" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("classification")}
                    >
                      <span className="inline-flex items-center">
                        Classification <SortIcon k="classification" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("manufacturer")}
                    >
                      <span className="inline-flex items-center">
                        Manufacturer <SortIcon k="manufacturer" />
                      </span>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Part #</TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap text-right"
                      onClick={() => handleSort("cost")}
                    >
                      <span className="inline-flex items-center justify-end w-full">
                        Unit Cost <SortIcon k="cost" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("unit")}
                    >
                      <span className="inline-flex items-center">
                        Unit <SortIcon k="unit" />
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => handleSort("supplier")}
                    >
                      <span className="inline-flex items-center">
                        Supplier <SortIcon k="supplier" />
                      </span>
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap w-[90px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id} className="group">
                      <TableCell className="font-medium">
                        <div>{m.name}</div>
                        {m.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {m.description}
                          </div>
                        )}
                        {m.tags && m.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {m.tags.map((t) => (
                              <Badge
                                key={t}
                                variant="secondary"
                                className="text-[10px] px-1 py-0"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{m.classification ?? "—"}</div>
                        {m.classification === "Cable" && m.cableType && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {cableTypeLabel(m.cableType)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{m.manufacturer ?? "—"}</TableCell>
                      <TableCell className="text-sm font-mono">{m.partNumber ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {fmt$(m.cost)}
                      </TableCell>
                      <TableCell className="text-sm">{m.unit ?? "—"}</TableCell>
                      <TableCell className="text-sm">{m.supplier ?? "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={m.isActive ? "default" : "outline"}
                          className="text-xs"
                        >
                          {m.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7"
                            onClick={() => openEdit(m)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeleteId(m.id);
                              setDeleteName(m.name);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId !== null ? "Edit Material" : "Add Material"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name + Cost + Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label htmlFor="mat-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mat-name"
                  placeholder="e.g. Cat6 UTP Cable"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mat-cost">
                  Unit Cost ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mat-cost"
                  type="number"
                  step={0.01}
                  min={0}
                  className="font-mono"
                  value={form.cost}
                  onChange={(e) => setField("cost", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mat-unit">Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setField("unit", v)}>
                  <SelectTrigger id="mat-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label htmlFor="mat-desc">Description</Label>
              <Input
                id="mat-desc"
                placeholder="Brief description of the material"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </div>

            {/* Classification + Manufacturer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="mat-class">Classification</Label>
                <Select
                  value={form.classification}
                  onValueChange={(v) => setField("classification", v)}
                >
                  <SelectTrigger id="mat-class">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSIFICATIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="mat-mfr">Manufacturer</Label>
                <Input
                  id="mat-mfr"
                  placeholder="e.g. Belden, CommScope"
                  value={form.manufacturer}
                  onChange={(e) => setField("manufacturer", e.target.value)}
                />
              </div>
            </div>

            {/* Cable Type — shown only when classification is Cable */}
            {form.classification === "Cable" && (
              <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3">
                <Label htmlFor="mat-cable-type" className="text-sm font-medium">
                  Cable Type
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Link this material to a cable type so the Cabling Estimator can use its unit
                  cost for material estimates. Cable types are managed in the Rate Editor.
                </p>
                <Select
                  value={form.cableType}
                  onValueChange={(v) => setField("cableType", v)}
                >
                  <SelectTrigger id="mat-cable-type">
                    <SelectValue placeholder="Select cable type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {cableTypeOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Part # + Supplier */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="mat-pn">Part Number / SKU</Label>
                <Input
                  id="mat-pn"
                  placeholder="e.g. 1583A"
                  value={form.partNumber}
                  onChange={(e) => setField("partNumber", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="mat-sup">Supplier</Label>
                <Input
                  id="mat-sup"
                  placeholder="e.g. Graybar, Anixter"
                  value={form.supplier}
                  onChange={(e) => setField("supplier", e.target.value)}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <Label htmlFor="mat-tags">Tags</Label>
              <Input
                id="mat-tags"
                placeholder="Comma-separated: plenum, cat6, structured"
                value={form.tags}
                onChange={(e) => setField("tags", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="mat-notes">Notes</Label>
              <Input
                id="mat-notes"
                placeholder="Additional notes or specifications"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
              />
            </div>

            {/* Status */}
            <div className="flex items-center gap-3">
              <Label htmlFor="mat-active" className="cursor-pointer">
                Active
              </Label>
              <input
                id="mat-active"
                type="checkbox"
                className="w-4 h-4 cursor-pointer"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
              />
              <span className="text-xs text-muted-foreground">
                Inactive materials are hidden from estimator dropdowns
              </span>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isBusy}>
              {isBusy ? "Saving…" : editingId !== null ? "Save Changes" : "Add Material"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Material</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteName}</strong>? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
