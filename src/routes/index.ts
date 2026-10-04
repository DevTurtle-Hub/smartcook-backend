import { Router } from "express";
import healthRoutes from "./health.route";
import authRoutes from "./auth.route";
import categoryRoutes from "./category.route";
import ingredientRoutes from "./ingredient.route";
import fridgeRoutes from "./fridge.route";
import recipeRoutes from "./recipe.route";
import adminRoutes from "./admin.route";
import cookingHistoryRoutes from "./cookingHistory.route";
import aiRoutes from "./ai.routes";
import communityRoutes from "./community.route";
import chatRoutes from "./chat.route";
import plannerRoutes from "./planner.route";
import storeRoutes from "./store.route";
import notificationRoutes from "./notification.route";
import rewardRoutes from "./reward.route";
import reportRoutes from "./report.route";

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
router.use("/ai", aiRoutes);

// Dual Routing Alias for Community (Web: /posts, Mobile: /community/posts)
router.use("/posts", communityRoutes);
router.use("/community/posts", communityRoutes);

// Realtime Chat & Conversations
router.use("/chat", chatRoutes);

// Phase 7: Meal Planner, Smart Shopping List & Stores
router.use("/planner", plannerRoutes);
router.use("/stores", storeRoutes);

// Phase 8: Notifications & Daily Rewards
router.use("/notifications", notificationRoutes);
router.use("/rewards", rewardRoutes);

// Moderation & Reports
router.use("/reports", reportRoutes);

export default router;
