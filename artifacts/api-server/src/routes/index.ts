import { Router, type IRouter } from "express";
import healthRouter from "./health";
import simulationRouter from "./simulation";
import redTeamRouter from "./redTeam";
import blueTeamRouter from "./blueTeam";
import commanderRouter from "./commander";
import assetsRouter from "./assets";
import threatsRouter from "./threats";
import incidentsRouter from "./incidents";
import socRouter from "./soc";
import copilotRouter from "./copilot";

const router: IRouter = Router();

router.use(healthRouter);
router.use(simulationRouter);
router.use(redTeamRouter);
router.use(blueTeamRouter);
router.use(commanderRouter);
router.use(assetsRouter);
router.use(threatsRouter);
router.use(incidentsRouter);
router.use(socRouter);
router.use(copilotRouter);

export default router;
