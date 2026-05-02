import { Router, type IRouter } from "express";
import healthRouter from "./health";
import estimatesRouter from "./estimates";
import runsRouter from "./runs";
import ratesRouter from "./rates";
import calculatorRouter from "./calculator";
import pathwayEstimatesRouter from "./pathwayEstimates";
import pathwaySegmentsRouter from "./pathwaySegments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(estimatesRouter);
router.use(runsRouter);
router.use(ratesRouter);
router.use(calculatorRouter);
router.use(pathwayEstimatesRouter);
router.use(pathwaySegmentsRouter);

export default router;
