import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";
import { estimatesTable } from "./estimates";
import { pathwayEstimatesTable } from "./pathwayEstimates";

export const cablingHardwareItemsTable = pgTable("cabling_hardware_items", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id")
    .notNull()
    .references(() => estimatesTable.id, { onDelete: "cascade" }),
  catalogKey: text("catalog_key"),
  name: text("name").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unitCost: doublePrecision("unit_cost").notNull(),
  unit: text("unit"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pathwayHardwareItemsTable = pgTable("pathway_hardware_items", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id")
    .notNull()
    .references(() => pathwayEstimatesTable.id, { onDelete: "cascade" }),
  catalogKey: text("catalog_key"),
  name: text("name").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unitCost: doublePrecision("unit_cost").notNull(),
  unit: text("unit"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type CablingHardwareItem = typeof cablingHardwareItemsTable.$inferSelect;
export type PathwayHardwareItem = typeof pathwayHardwareItemsTable.$inferSelect;
