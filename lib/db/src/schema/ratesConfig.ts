import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const ratesConfigTable = pgTable("rates_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type RatesConfigRow = typeof ratesConfigTable.$inferSelect;
