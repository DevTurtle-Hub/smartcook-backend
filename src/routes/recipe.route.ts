import { Router } from "express";
import { recipeController } from "../controllers/recipe.controller";
import { authenticate, optionalAuthenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createRecipeSchema,
  updateRecipeSchema,
} from "../validators/recipe.validator";

const router = Router();

// 1. Fridge Match Ranking Endpoint (Protected - relies on user's fridge items)
router.get("/fridge-match", authenticate, recipeController.getFridgeMatch);

// 2. Recipe Listing & Details (Public or Enriched with User Preferences)
router.get("/", optionalAuthenticate, recipeController.getAll);
router.get("/:id", optionalAuthenticate, recipeController.getById);

// 3. User Actions (Protected)
router.post("/:id/favorite", authenticate, recipeController.toggleFavorite);

// 4. Admin / Chef Management Endpoints
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createRecipeSchema),
  recipeController.create
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateRecipeSchema),
  recipeController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  recipeController.delete
);

export default router;
