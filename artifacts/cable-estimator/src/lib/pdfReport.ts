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
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
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

  // ── Estimate context + Totals (side by side, compact) ────────────────
  const halfGutter = 12;
  const halfWidth = (pageWidth - 2 * margin - halfGutter) / 2;
  const ctxStartY = y;

  autoTable(doc, {
    startY: ctxStartY,
    theme: "grid",
    headStyles: { fillColor: [33, 37, 41], fontSize: 8, cellPadding: 2 },
    bodyStyles: { fontSize: 8, cellPadding: 1.8 },
    head: [["Field", "Value"]],
    body: [
      ["Install Type", labelFor(INSTALL_TYPES, detail.estimate.installType)],
      ["Building Type", labelFor(BUILDING_TYPES, detail.estimate.buildingType)],
      ["Environment", labelFor(ENVIRONMENTS, detail.estimate.environment)],
      ["Skill Level", labelFor(SKILL_LEVELS, detail.estimate.skillLevel)],
      ["Hourly Rate", fmtMoney(detail.estimate.hourlyRate) + "/hr"],
      ...(detail.estimate.notes ? [["Notes", detail.estimate.notes]] : []),
    ],
    margin: { left: margin },
    tableWidth: halfWidth,
  });
  const ctxEndY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  autoTable(doc, {
    startY: ctxStartY,
    theme: "grid",
    headStyles: { fillColor: [33, 37, 41], fontSize: 8, cellPadding: 2 },
    bodyStyles: { fontSize: 8, cellPadding: 1.8 },
    head: [["Metric", "Value"]],
    body: [
      ["Total Cables", String(detail.totals.totalCables)],
      ["Total Runs", String(detail.totals.totalRuns)],
      ["Total Hours", fmtHours(detail.totals.totalHoursAvg)],
      ["Total Cost", fmtMoney(detail.totals.totalCostAvg)],
      ["Bulk Pull Savings", fmtHours(detail.totals.bulkSavingsHours ?? 0)],
    ],
    margin: { left: margin + halfWidth + halfGutter },
    tableWidth: halfWidth,
    columnStyles: { 1: { halign: "right" } },
  });
  const totalsEndY = (doc as unknown as { lastAutoTable: { finalY: number } })
    .lastAutoTable.finalY;

  y = Math.max(ctxEndY, totalsEndY) + 14;

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
      r.cableType === "fiber"
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

  // ── Rates section (landscape, multi-column) ───────────────────────────
  doc.addPage();
  const lwPage = doc.internal.pageSize.getWidth();
  const lhPage = doc.internal.pageSize.getHeight();
  const ratesMargin = 24;
  const gutter = 10;
  const numCols = 3;
  const colWidth =
    (lwPage - 2 * ratesMargin - gutter * (numCols - 1)) / numCols;
  const colX = (i: number) => ratesMargin + i * (colWidth + gutter);
  const colY: number[] = [0, 0, 0];

  // Page header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Rate Editor Values", ratesMargin, ratesMargin + 6);
  const headerEnd = ratesMargin + 16;
  colY[0] = headerEnd;
  colY[1] = headerEnd;
  colY[2] = headerEnd;

  const lastY = () =>
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY;

  // Place a small block (title + table) into the shortest column.
  // Returns the column index used.
  const placeBlock = (
    title: string,
    head: string[][],
    body: (string | number)[][],
    opts: { columnStyles?: Record<number, { halign?: "left" | "right" }> } = {},
  ): number => {
    if (body.length === 0) return -1;
    let col = 0;
    for (let i = 1; i < numCols; i++) if (colY[i] < colY[col]) col = i;
    // If shortest column would overflow, start a new page
    const estHeight = 14 + (body.length + 1) * 12 + 8;
    if (colY[col] + estHeight > lhPage - 32) {
      doc.addPage("letter", "landscape");
      colY[0] = ratesMargin;
      colY[1] = ratesMargin;
      colY[2] = ratesMargin;
      col = 0;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(title, colX(col), colY[col] + 8);
    autoTable(doc, {
      startY: colY[col] + 11,
      theme: "grid",
      headStyles: {
        fillColor: [33, 37, 41],
        fontSize: 7,
        cellPadding: 2,
      },
      bodyStyles: { fontSize: 7, cellPadding: 1.8 },
      head,
      body,
      margin: { left: colX(col) },
      tableWidth: colWidth,
      columnStyles: opts.columnStyles,
    });
    colY[col] = lastY() + 8;
    return col;
  };

  // Common
  placeBlock(
    "Common",
    [["Setting", "Value"]],
    [
      ["Hourly Rate", fmtMoney(rates.hourlyRate ?? 0) + "/hr"],
      ["Bulk Factor α", (rates.bulkFactorAlpha ?? 0.15).toFixed(3)],
    ],
    { columnStyles: { 1: { halign: "right" } } },
  );

  // Cable Type Rates (combined pull + termination)
  const cableKeys = Array.from(
    new Set([
      ...Object.keys(rates.pullMinutesPer10Ft ?? {}),
      ...Object.keys(rates.terminationMinutesPerEnd ?? {}),
    ]),
  );
  placeBlock(
    "Cable Type Rates",
    [["Cable", "Pull min/10ft", "Term min/end"]],
    cableKeys.map((k) => [
      labelFor(cableTypeLookup, k),
      String(rates.pullMinutesPer10Ft?.[k] ?? "—"),
      String(rates.terminationMinutesPerEnd?.[k] ?? "—"),
    ]),
    { columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } } },
  );

  // Multiplier blocks
  const multBlock = (
    title: string,
    obj: Record<string, number> | undefined,
    lookup?: readonly { value: string; label: string }[],
  ) => {
    if (!obj || Object.keys(obj).length === 0) return;
    placeBlock(
      title,
      [["Option", "Mult"]],
      Object.entries(obj).map(([k, v]) => [
        lookup ? labelFor(lookup, k) : titleCase(k),
        `${v.toFixed(3)}×`,
      ]),
      { columnStyles: { 1: { halign: "right" } } },
    );
  };

  multBlock("Install Type", rates.installTypeMult, INSTALL_TYPES);
  multBlock("Ceiling", rates.ceilingMult, CEILING_TYPES);
  multBlock("Pathway Complexity", rates.pathwayMult, PATHWAY_LEVELS);
  multBlock("Building Type", rates.buildingMult, BUILDING_TYPES);
  multBlock("Environment", rates.environmentMult, ENVIRONMENTS);
  multBlock("Skill Level", rates.skillMult, SKILL_LEVELS);
  multBlock("Mounting Height", rates.pathwayMountingHeightMult);
  multBlock("Pathway Ceiling", rates.pathwayCeilingMult);

  // Cable fill — two-mult block
  if (
    rates.pathwayCableFillMult &&
    Object.keys(rates.pathwayCableFillMult).length > 0
  ) {
    placeBlock(
      "Cable Fill",
      [["Level", "Labor ×", "Mat'l ×"]],
      Object.entries(rates.pathwayCableFillMult).map(([k, v]) => [
        titleCase(k),
        `${v.laborMult.toFixed(3)}×`,
        `${v.materialMult.toFixed(3)}×`,
      ]),
      { columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } } },
    );
  }

  // Pathway adders (scalars)
  const scalars: Array<[string, string]> = [];
  if (rates.pathwayBendLaborHrs !== undefined)
    scalars.push(["Bend labor (hrs)", rates.pathwayBendLaborHrs.toFixed(2)]);
  if (rates.pathwayBendMaterialCost !== undefined)
    scalars.push(["Bend material", fmtMoney(rates.pathwayBendMaterialCost)]);
  if (rates.pathwayPenetrationLaborHrs !== undefined)
    scalars.push([
      "Penetration labor (hrs)",
      rates.pathwayPenetrationLaborHrs.toFixed(2),
    ]);
  if (rates.pathwayPenetrationMaterialCost !== undefined)
    scalars.push([
      "Penetration material",
      fmtMoney(rates.pathwayPenetrationMaterialCost),
    ]);
  if (scalars.length > 0) {
    placeBlock("Pathway Adders", [["Setting", "Value"]], scalars, {
      columnStyles: { 1: { halign: "right" } },
    });
  }

  // Pathway Type Rates — wider, spans full page width below the columns
  if (
    rates.pathwayTypeRates &&
    Object.keys(rates.pathwayTypeRates).length > 0
  ) {
    const maxColY = Math.max(...colY);
    const ptHeader = maxColY + 4;
    if (ptHeader + 80 > lhPage - 32) {
      doc.addPage("letter", "landscape");
      colY[0] = ratesMargin;
      colY[1] = ratesMargin;
      colY[2] = ratesMargin;
    }
    const startY = Math.max(...colY) + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Pathway Type Rates", ratesMargin, startY + 8);
    autoTable(doc, {
      startY: startY + 11,
      theme: "grid",
      headStyles: { fillColor: [33, 37, 41], fontSize: 7, cellPadding: 2 },
      bodyStyles: { fontSize: 7, cellPadding: 1.8 },
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
      margin: { left: ratesMargin, right: ratesMargin },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
        5: { halign: "right" },
      },
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
