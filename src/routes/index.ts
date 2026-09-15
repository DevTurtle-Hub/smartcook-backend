import { Router } from "express";
import healthRoutes from "./health.route";

const router = Router();

// Register all modular routes here
router.use("/health", healthRoutes);

export default router;
