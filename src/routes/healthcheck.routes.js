import { Router } from 'express';
import { healthcheck } from '../controllers/healthcheck.controller.js';
import { verifyJWT } from "../middlewares/auth.middle.js";

const router = Router();
router.route("/").get(verifyJWT,healthcheck)


export default router


