import { Router } from "express";
import { HealthController } from "../controllers/health.controller";

const router = Router();

// System Health Check Endpoint
router.get("/", HealthController.checkHealth);

export default router;
