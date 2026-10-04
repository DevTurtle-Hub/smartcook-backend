import { Router } from "express";
import { categoryController } from "../controllers/category.controller";
import { validate } from "../middlewares/validate";
import { authenticate, authorize } from "../middlewares/auth";
import { cacheMiddleware } from "../middlewares/cache";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validators/category.validator";

const router = Router();

// Public Routes (Mobile App) - Cached for 24h
router.get("/", cacheMiddleware(86400, "categories"), categoryController.getAll);
router.get("/:code", cacheMiddleware(86400, "categories"), categoryController.getByCode);

// Protected Admin Routes (Web Admin)
router.post(
  "/",
  authenticate,
  authorize("admin"),
  validate(createCategorySchema),
  categoryController.create
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(updateCategorySchema),
  categoryController.update
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  categoryController.delete
);

export default router;
