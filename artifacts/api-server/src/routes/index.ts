import { Router, type IRouter } from "express";
import cxosRouter from "./cxos";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cxosRouter);

export default router;
