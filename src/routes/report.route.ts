import { Router } from "express";
import { reportController } from "../controllers/report.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createReportSchema,
  getReportsQuerySchema,
  resolveReportSchema,
} from "../validators/report.validator";

const router = Router();

// Public authenticated endpoint: Any user can report a post/comment/recipe/user
router.post(
  "/",
  authenticate,
  validate(createReportSchema),
  reportController.createReport
);

// Admin-only endpoints
router.get(
  "/",
  authenticate,
  authorize("admin"),
  validate(getReportsQuerySchema, "query"),
  reportController.getReports
);

router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  reportController.getReportById
);

router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  validate(resolveReportSchema),
  reportController.resolveReport
);

export default router;
