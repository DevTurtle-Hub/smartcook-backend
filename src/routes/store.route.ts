import { Router } from "express";
import { storeController } from "../controllers/store.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { cacheMiddleware } from "../middlewares/cache";

const router = Router();

// Public routes for GPS store search (Cached for 6h)
router.get("/nearby", storeController.getNearbyStores);
router.get("/", cacheMiddleware(21600, "stores"), storeController.getAllStores);
router.get("/:id", cacheMiddleware(21600, "stores"), storeController.getStoreById);

// Admin-only route for creating, updating and deleting stores
router.post("/", authenticate, authorize("admin"), storeController.createStore);
router.put("/:id", authenticate, authorize("admin"), storeController.updateStore);
router.delete("/:id", authenticate, authorize("admin"), storeController.deleteStore);

export default router;
