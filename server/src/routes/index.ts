import { Router } from "express";
import configRouter from "./config.js";
import spinRouter from "./spin.js";
import winnersRouter from "./winners.js";
import adminRouter from "./admin.js";
import devRouter from "./dev.js";

const router = Router();

router.use(configRouter);
router.use(spinRouter);
router.use(winnersRouter);
router.use(adminRouter);
router.use(devRouter);

export default router;
