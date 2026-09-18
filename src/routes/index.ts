import { Router } from "express";
import healthRoutes from "./health.route";
import authRoutes from "./auth.route";

const router = Router();

// Modular Routes Registration
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);

export default router;
