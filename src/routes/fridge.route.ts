import { Router } from "express";
import { fridgeController } from "../controllers/fridge.controller";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  addFridgeItemSchema,
  updateFridgeItemSchema,
} from "../validators/fridge.validator";

const router = Router();

// All fridge endpoints are protected
router.use(authenticate);

router.get("/", fridgeController.getMyFridge);
router.get("/my-fridge", fridgeController.getMyFridge);
router.get("/items", fridgeController.getMyFridge);
router.post("/items", validate(addFridgeItemSchema), fridgeController.addItem);
router.put("/items/:itemId", validate(updateFridgeItemSchema), fridgeController.updateItem);
router.delete("/items/:itemId", fridgeController.removeItem);
router.delete("/clear", fridgeController.clearFridge);

export default router;
