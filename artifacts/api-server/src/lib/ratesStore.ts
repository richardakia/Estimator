import { eq } from "drizzle-orm";
import { db, ratesConfigTable } from "@workspace/db";
import { apiSchemas } from "@workspace/api-zod";
import { DEFAULT_RATES, type RatesConfigShape } from "./calculator";
import { logger } from "./logger";

const RATES_KEY = "global";

function validateOrFallback(value: unknown): RatesConfigShape {
  const parsed = apiSchemas.UpdateRatesBody.safeParse(value);
  if (!parsed.success) {
    logger.warn(
      { issues: parsed.error.issues },
      "rates_config row failed validation; falling back to defaults",
    );
    return DEFAULT_RATES;
  }
  return parsed.data as RatesConfigShape;
}

export async function getRates(): Promise<RatesConfigShape> {
  const [row] = await db
    .select()
    .from(ratesConfigTable)
    .where(eq(ratesConfigTable.key, RATES_KEY));

  if (!row) {
    await db.insert(ratesConfigTable).values({
      key: RATES_KEY,
      value: DEFAULT_RATES,
    });
    return DEFAULT_RATES;
  }

  const parsed = apiSchemas.UpdateRatesBody.safeParse(row.value);
  if (!parsed.success) {
    logger.warn(
      { issues: parsed.error.issues },
      "rates_config row failed validation; reseeding defaults",
    );
    await db
      .update(ratesConfigTable)
      .set({ value: DEFAULT_RATES })
      .where(eq(ratesConfigTable.key, RATES_KEY));
    return DEFAULT_RATES;
  }
  return parsed.data as RatesConfigShape;
}

export async function saveRates(
  rates: RatesConfigShape,
): Promise<RatesConfigShape> {
  const existing = await db
    .select()
    .from(ratesConfigTable)
    .where(eq(ratesConfigTable.key, RATES_KEY));

  if (existing.length === 0) {
    await db.insert(ratesConfigTable).values({
      key: RATES_KEY,
      value: rates,
    });
  } else {
    await db
      .update(ratesConfigTable)
      .set({ value: rates })
      .where(eq(ratesConfigTable.key, RATES_KEY));
  }

  return rates;
}

export async function resetRates(): Promise<RatesConfigShape> {
  return saveRates(DEFAULT_RATES);
}
