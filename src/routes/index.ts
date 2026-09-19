import { Router } from "express";
import healthRoutes from "./health.route";
import authRoutes from "./auth.route";
import categoryRoutes from "./category.route";
import ingredientRoutes from "./ingredient.route";
import fridgeRoutes from "./fridge.route";
import recipeRoutes from "./recipe.route";
import adminRoutes from "./admin.route";
import cookingHistoryRoutes from "./cookingHistory.route";

const router = Router();

// Modular Routes Registration
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/ingredients", ingredientRoutes);
router.use("/fridge", fridgeRoutes);
router.use("/recipes", recipeRoutes);
router.use("/admin", adminRoutes);
router.use("/cooking-history", cookingHistoryRoutes);

export default router;
