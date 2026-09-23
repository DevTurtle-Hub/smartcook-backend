import { Router } from "express";
import { plannerController } from "../controllers/planner.controller";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  setMealSlotSchema,
  addCartItemSchema,
  updateBoughtSchema,
} from "../validators/planner.validator";

const router = Router();

// All planner and shopping list routes require authentication
router.use(authenticate);

// ================= MEAL PLANNER =================
router.get("/current-week", plannerController.getCurrentWeekPlan);
router.put("/meals", validate(setMealSlotSchema), plannerController.setMealSlot);
router.delete("/meals", plannerController.removeMealSlot);

// ================= SMART SHOPPING LIST =================
router.get("/shopping-list", plannerController.getShoppingList);
router.post(
  "/shopping-list",
  validate(addCartItemSchema),
  plannerController.addCartItem
);
router.patch(
  "/shopping-list/:id/bought",
  validate(updateBoughtSchema),
  plannerController.updateBoughtStatus
);
router.delete("/shopping-list/clear-bought", plannerController.clearBoughtItems);
router.delete("/shopping-list/:id", plannerController.removeCartItem);

// ================= SYNC BOUGHT TO FRIDGE =================
router.post("/sync-to-fridge", plannerController.syncBoughtToFridge);

export default router;
