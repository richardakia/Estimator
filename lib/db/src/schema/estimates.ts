import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
} from "drizzle-orm/pg-core";

export const estimatesTable = pgTable("estimates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  installType: text("install_type").notNull(),
  buildingType: text("building_type").notNull(),
  environment: text("environment").notNull(),
  skillLevel: text("skill_level").notNull(),
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

export const runsTable = pgTable("runs", {
  id: serial("id").primaryKey(),
  estimateId: integer("estimate_id")
    .notNull()
    .references(() => estimatesTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  cableType: text("cable_type").notNull(),
  description: text("description"),
  numCables: integer("num_cables").notNull(),
  fiberStrands: integer("fiber_strands").notNull().default(1),
  lengthFt: doublePrecision("length_ft").notNull(),
  ceilingType: text("ceiling_type").notNull(),
  pathwayComplexity: text("pathway_complexity").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Estimate = typeof estimatesTable.$inferSelect;
export type Run = typeof runsTable.$inferSelect;
