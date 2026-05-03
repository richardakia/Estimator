import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  CABLE_TYPES,
  INSTALL_TYPES,
  CEILING_TYPES,
  PATHWAY_LEVELS,
  BUILDING_TYPES,
  ENVIRONMENTS,
  SKILL_LEVELS,
  labelFor,
} from "./options";

interface EstimateForReport {
  estimate: {
    name: string;
    installType: string;
    buildingType: string;
    environment: string;
    skillLevel: string;
    hourlyRate: number;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  runs: Array<{
    label: string;
    cableType: string;
    numCables: number;
    fiberStrands?: number;
    lengthFt: number;
    ceilingType: string;
    pathwayComplexity: string;
    bulkFactor: number;
    conditionMultiplier: number;
    pullHoursPerCable: number;
    terminationHoursPerCable: number;
    runHoursAvg: number;
    runCostAvg: number;
  }>;
  totals: {
    totalCables: number;
    totalRuns: number;
    totalHoursAvg: number;
    totalCostAvg: number;
    bulkSavingsHours?: number;
    taskBreakdown: Array<{
      task: string;
      percent: number;
      hoursAvg: number;
      costAvg: number;
    }>;
  };
}

interface RatesForReport {
  hourlyRate?: number;
  bulkFactorAlpha?: number;
  customCableTypes?: Array<{ value: string; label: string }>;
  pullMinutesPer10Ft: Record<string, number>;
  terminationMinutesPerEnd: Record<string, number>;
  installTypeMult: Record<string, number>;
  ceilingMult: Record<string, number>;
  pathwayMult: Record<string, number>;
  buildingMult: Record<string, number>;
  environmentMult: Record<string, number>;
  skillMult: Record<string, number>;
  pathwayTypeRates?: Record<
    string,
    {
      laborMinPerFt: number;
      materialCostPerFt: number;
      fastenerSpacingFt: number;
      fastenerCostEach: number;
      fastenerLaborMinEach: number;
    }
  >;
  pathwayMountingHeightMult?: Record<string, number>;
  pathwayCeilingMult?: Record<string, number>;
  pathwayCableFillMult?: Record<
    string,
    { laborMult: number; materialMult: number }
  >;
  pathwayBendLaborHrs?: number;
  pathwayBendMaterialCost?: number;
  pathwayPenetrationLaborHrs?: number;
  pathwayPenetrationMaterialCost?: number;
}

const fmtMoney = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const fmtHours = (n: number) => `${n.toFixed(1)} hr`;
const titleCase = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function generateEstimatePdf(
  detail: EstimateForReport,
  rates: RatesForReport,
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // ── Header ────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Cabling Labor Estimate", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(detail.estimate.name, margin, y);
  y += 14;

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Generated ${new Date().toLocaleString()}`,
    margin,
    y,
  );
  doc.setTextColor(0);
  y += 18;

  // ── Estimate context ──────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [33, 37, 41] },
    head: [["Field", "Value"]],
    body: [
      ["Install Type", labelFor(INSTALL_TYPES, detail.estimate.installType)],
      ["Building Type", labelFor(BUILDING_TYPES, detail.estimate.buildingType)],
      ["Environment", labelFor(ENVIRONMENTS, detail.estimate.environment)],
      ["Skill Level", labelFor(SKILL_LEVELS, detail.estimate.skillLevel)],
      ["Hourly Rate", fmtMoney(detail.estimate.hourlyRate) + "/hr"],
      ...(detail.estimate.notes ? [["Notes", detail.estimate.notes]] : []),
    ],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  // ── Totals summary ────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Totals", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [33, 37, 41] },
    head: [["Metric", "Value"]],
    body: [
      ["Total Cables", String(detail.totals.totalCables)],
      ["Total Runs", String(detail.totals.totalRuns)],
      ["Total Hours", fmtHours(detail.totals.totalHoursAvg)],
      ["Total Cost", fmtMoney(detail.totals.totalCostAvg)],
      [
        "Bulk Pull Savings",
        fmtHours(detail.totals.bulkSavingsHours ?? 0),
      ],
    ],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  // ── Cable Runs ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Cable Runs", margin, y);
  y += 8;

  const cableTypeLookup = [
    ...CABLE_TYPES,
    ...(rates.customCableTypes ?? []),
  ];

  autoTable(doc, {
    startY: y,
    theme: "striped",
    headStyles: { fillColor: [33, 37, 41] },
    head: [
      [
        "Label",
        "Cable",
        "# Cables",
        "Strands",
        "Length",
        "Ceiling",
        "Pathway",
        "Bulk",
        "Cond",
        "Pull hrs",
        "Term hrs",
        "Total hrs",
        "Cost",
      ],
    ],
    body: detail.runs.map((r) => [
      r.label,
      labelFor(cableTypeLookup, r.cableType),
      r.numCables,
      r.cableType === "sm_fiber" || r.cableType === "mm_fiber"
        ? (r.fiberStrands ?? 1)
        : "—",
      `${r.lengthFt} ft`,
      labelFor(CEILING_TYPES, r.ceilingType),
      labelFor(PATHWAY_LEVELS, r.pathwayComplexity),
      `${r.bulkFactor.toFixed(3)}×`,
      `${r.conditionMultiplier.toFixed(3)}×`,
      (r.pullHoursPerCable * r.numCables).toFixed(2),
      (r.terminationHoursPerCable * r.numCables).toFixed(2),
      r.runHoursAvg.toFixed(2),
      fmtMoney(r.runCostAvg),
    ]),
    margin: { left: margin, right: margin },
    styles: { fontSize: 8 },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      7: { halign: "right" },
      8: { halign: "right" },
      9: { halign: "right" },
      10: { halign: "right" },
      11: { halign: "right" },
      12: { halign: "right" },
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  // ── Task Breakdown ────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Task Breakdown", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [33, 37, 41] },
    head: [["Task", "% of Effort", "Hours", "Cost"]],
    body: detail.totals.taskBreakdown.map((t) => [
      t.task,
      `${(t.percent * 100).toFixed(1)}%`,
      t.hoursAvg.toFixed(2),
      fmtMoney(t.costAvg),
    ]),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  // ── Rates section (new page) ──────────────────────────────────────────
  doc.addPage();
  y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Rate Editor Values", margin, y);
  y += 22;

  // Common rates
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Common", margin, y);
  y += 8;
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [33, 37, 41] },
    head: [["Setting", "Value"]],
    body: [
      ["Default Hourly Rate", fmtMoney(rates.hourlyRate ?? 0) + "/hr"],
      [
        "Bulk Factor α (sensitivity)",
        (rates.bulkFactorAlpha ?? 0.15).toFixed(3),
      ],
    ],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  // Cable Type rates
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Cable Type Rates", margin, y);
  y += 8;
  const cableKeys = Array.from(
    new Set([
      ...Object.keys(rates.pullMinutesPer10Ft ?? {}),
      ...Object.keys(rates.terminationMinutesPerEnd ?? {}),
    ]),
  );
  autoTable(doc, {
    startY: y,
    theme: "grid",
    headStyles: { fillColor: [33, 37, 41] },
    head: [["Cable Type", "Pull min / 10ft", "Termination min / end"]],
    body: cableKeys.map((k) => [
      labelFor(cableTypeLookup, k),
      String(rates.pullMinutesPer10Ft?.[k] ?? "—"),
      String(rates.terminationMinutesPerEnd?.[k] ?? "—"),
    ]),
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;

  // Multipliers
  const multSection = (
    title: string,
    obj: Record<string, number> | undefined,
    lookup?: readonly { value: string; label: string }[],
  ) => {
    if (!obj || Object.keys(obj).length === 0) return;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, margin, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      theme: "grid",
      headStyles: { fillColor: [33, 37, 41] },
      head: [["Option", "Multiplier"]],
      body: Object.entries(obj).map(([k, v]) => [
        lookup ? labelFor(lookup, k) : titleCase(k),
        `${v.toFixed(3)}×`,
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      columnStyles: { 1: { halign: "right" } },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 16;
  };

  multSection("Install Type Multipliers", rates.installTypeMult, INSTALL_TYPES);
  multSection("Ceiling Multipliers", rates.ceilingMult, CEILING_TYPES);
  multSection("Pathway Complexity Multipliers", rates.pathwayMult, PATHWAY_LEVELS);
  multSection("Building Type Multipliers", rates.buildingMult, BUILDING_TYPES);
  multSection("Environment Multipliers", rates.environmentMult, ENVIRONMENTS);
  multSection("Skill Level Multipliers", rates.skillMult, SKILL_LEVELS);

  // Pathway type rates
  if (
    rates.pathwayTypeRates &&
    Object.keys(rates.pathwayTypeRates).length > 0
  ) {
    if (y > 600) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Pathway Type Rates", margin, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      theme: "grid",
      headStyles: { fillColor: [33, 37, 41] },
      head: [
        [
          "Pathway",
          "Labor min/ft",
          "Material $/ft",
          "Fastener spacing (ft)",
          "Fastener $",
          "Fastener min",
        ],
      ],
      body: Object.entries(rates.pathwayTypeRates).map(([k, v]) => [
        titleCase(k),
        v.laborMinPerFt,
        fmtMoney(v.materialCostPerFt),
        v.fastenerSpacingFt,
        fmtMoney(v.fastenerCostEach),
        v.fastenerLaborMinEach,
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 8 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 16;
  }

  multSection(
    "Pathway Mounting Height Multipliers",
    rates.pathwayMountingHeightMult,
  );
  multSection("Pathway Ceiling Multipliers", rates.pathwayCeilingMult);

  // Cable fill (laborMult / materialMult)
  if (
    rates.pathwayCableFillMult &&
    Object.keys(rates.pathwayCableFillMult).length > 0
  ) {
    if (y > 650) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Pathway Cable Fill Multipliers", margin, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      theme: "grid",
      headStyles: { fillColor: [33, 37, 41] },
      head: [["Fill Level", "Labor ×", "Material ×"]],
      body: Object.entries(rates.pathwayCableFillMult).map(([k, v]) => [
        titleCase(k),
        `${v.laborMult.toFixed(3)}×`,
        `${v.materialMult.toFixed(3)}×`,
      ]),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 16;
  }

  // Bend / penetration scalars
  const scalars: Array<[string, string]> = [];
  if (rates.pathwayBendLaborHrs !== undefined)
    scalars.push(["Bend labor (hrs each)", rates.pathwayBendLaborHrs.toFixed(2)]);
  if (rates.pathwayBendMaterialCost !== undefined)
    scalars.push([
      "Bend material cost ($ each)",
      fmtMoney(rates.pathwayBendMaterialCost),
    ]);
  if (rates.pathwayPenetrationLaborHrs !== undefined)
    scalars.push([
      "Penetration labor (hrs each)",
      rates.pathwayPenetrationLaborHrs.toFixed(2),
    ]);
  if (rates.pathwayPenetrationMaterialCost !== undefined)
    scalars.push([
      "Penetration material cost ($ each)",
      fmtMoney(rates.pathwayPenetrationMaterialCost),
    ]);
  if (scalars.length > 0) {
    if (y > 680) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Pathway Adders", margin, y);
    y += 8;
    autoTable(doc, {
      startY: y,
      theme: "grid",
      headStyles: { fillColor: [33, 37, 41] },
      head: [["Setting", "Value"]],
      body: scalars,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      columnStyles: { 1: { halign: "right" } },
    });
  }

  // ── Page footer with page numbers ─────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 18,
      { align: "right" },
    );
    doc.text(
      detail.estimate.name,
      margin,
      doc.internal.pageSize.getHeight() - 18,
    );
    doc.setTextColor(0);
  }

  const safeName = detail.estimate.name.replace(/[^a-z0-9]+/gi, "_") || "estimate";
  doc.save(`${safeName}_report.pdf`);
}
