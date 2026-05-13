import { Router, type IRouter } from "express";
import healthRouter from "./health";
import estimatesRouter from "./estimates";
import runsRouter from "./runs";
import ratesRouter from "./rates";
import calculatorRouter from "./calculator";
import pathwayEstimatesRouter from "./pathwayEstimates";
import pathwaySegmentsRouter from "./pathwaySegments";
import cablingHardwareItemsRouter from "./cablingHardwareItems";
import pathwayHardwareItemsRouter from "./pathwayHardwareItems";
import materialsRouter from "./materials";

const router: IRouter = Router();

router.use(healthRouter);
router.use(estimatesRouter);
router.use(runsRouter);
router.use(ratesRouter);
router.use(calculatorRouter);
router.use(pathwayEstimatesRouter);
router.use(pathwaySegmentsRouter);
router.use(cablingHardwareItemsRouter);
router.use(pathwayHardwareItemsRouter);
router.use(materialsRouter);

export default router;
