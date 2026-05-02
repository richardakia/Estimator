import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";

export const pathwayEstimatesTable = pgTable("pathway_estimates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  installType: text("install_type").notNull().default("new_install"),
  buildingType: text("building_type").notNull().default("office"),
  environment: text("environment").notNull().default("unoccupied"),
  skillLevel: text("skill_level").notNull().default("journeyman"),
  hourlyRate: doublePrecision("hourly_rate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const pathwaySegmentsTable = pgTable("pathway_segments", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id")
    .notNull()
    .references(() => pathwayEstimatesTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  pathwayType: text("pathway_type").notNull(),
  lengthFt: doublePrecision("length_ft").notNull(),
  mountingHeight: text("mounting_height").notNull(),
  ceilingType: text("ceiling_type").notNull(),
  cableFill: text("cable_fill").notNull(),
  bends: integer("bends").notNull().default(0),
  penetrations: integer("penetrations").notNull().default(0),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PathwayEstimate = typeof pathwayEstimatesTable.$inferSelect;
export type PathwaySegment = typeof pathwaySegmentsTable.$inferSelect;
