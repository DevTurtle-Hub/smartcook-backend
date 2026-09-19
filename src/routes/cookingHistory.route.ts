import { Router } from "express";
import { cookingHistoryController } from "../controllers/cookingHistory.controller";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createCookingHistorySchema } from "../validators/cookingHistory.validator";

const router = Router();

// All cooking history endpoints are protected by JWT authentication
router.use(authenticate);

router.post(
  "/",
  validate(createCookingHistorySchema),
  cookingHistoryController.record
);

router.get("/", cookingHistoryController.getAll);

router.delete("/:id", cookingHistoryController.delete);

export default router;
