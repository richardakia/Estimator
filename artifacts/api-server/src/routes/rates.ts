import { Router, type IRouter } from "express";
import { apiSchemas } from "@workspace/api-zod";
import { getRates, saveRates, resetRates } from "../lib/ratesStore";
import type { RatesConfigShape } from "../lib/calculator";

const router: IRouter = Router();

router.get("/rates", async (_req, res): Promise<void> => {
  const rates = await getRates();
  res.json(rates);
});

router.put("/rates", async (req, res): Promise<void> => {
  const parsed = apiSchemas.UpdateRatesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const saved = await saveRates(parsed.data as RatesConfigShape);
  res.json(saved);
});

router.post("/rates", async (_req, res): Promise<void> => {
  const reset = await resetRates();
  res.json(reset);
});

export default router;
