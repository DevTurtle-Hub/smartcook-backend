import { Router } from "express";
import { ingredientController } from "../controllers/ingredient.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth";
import { cacheMiddleware } from "../middlewares/cache";
import {
  createIngredientSchema,
  updateIngredientSchema,
} from "../validators/ingredient.validator";

const router = Router();

// Public Routes (Mobile App) - Cached for 12h
router.get("/", cacheMiddleware(43200, "ingredients"), ingredientController.getAll);
router.get("/category/:category", cacheMiddleware(43200, "ingredients"), ingredientController.getByCategory);
router.get("/:id", cacheMiddleware(43200, "ingredients"), ingredientController.getById);

// Admin Routes (Web Admin)
router.post(
  "/seed",
  authenticate,
  authorize("admin"),
  ingredientController.seed
);

router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createIngredientSchema),
  ingredientController.create
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateIngredientSchema),
  ingredientController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  ingredientController.delete
);

export default router;
