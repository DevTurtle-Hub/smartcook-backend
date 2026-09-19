import { Router } from "express";
import { recipeController } from "../controllers/recipe.controller";
import { authenticate, optionalAuthenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createRecipeSchema,
  updateRecipeSchema,
} from "../validators/recipe.validator";

import { uploadSingleImage } from "../middlewares/upload";
import { processRecipeFormData } from "../middlewares/recipeUpload";

const router = Router();

// 1. Fridge Match Ranking Endpoint (Protected - relies on user's fridge items)
router.get("/fridge-match", authenticate, recipeController.getFridgeMatch);

// 2. Recipe Listing & Details (Public or Enriched with User Preferences)
router.get("/", optionalAuthenticate, recipeController.getAll);
router.get("/:id", optionalAuthenticate, recipeController.getById);

// 3. User Actions (Protected)
router.post("/:id/favorite", authenticate, recipeController.toggleFavorite);

// 4. Authenticated / Chef & Admin Recipe Management Endpoints
router.post(
  "/",
  authenticate,
  uploadSingleImage,
  processRecipeFormData,
  validate(createRecipeSchema),
  recipeController.create
);

router.put(
  "/:id",
  authenticate,
  uploadSingleImage,
  processRecipeFormData,
  validate(updateRecipeSchema),
  recipeController.update
);

router.delete(
  "/:id",
  authenticate,
  recipeController.delete
);

export default router;
