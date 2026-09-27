import { Router } from "express";
import { storeController } from "../controllers/store.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

// Public routes for GPS store search
router.get("/nearby", storeController.getNearbyStores);
router.get("/", storeController.getAllStores);
router.get("/:id", storeController.getStoreById);

// Admin-only route for creating, updating and deleting stores
router.post("/", authenticate, authorize("admin"), storeController.createStore);
router.put("/:id", authenticate, authorize("admin"), storeController.updateStore);
router.delete("/:id", authenticate, authorize("admin"), storeController.deleteStore);

export default router;
