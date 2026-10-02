import { Router } from "express";
import { rewardController } from "../controllers/reward.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// Tất cả endpoints đổi thưởng đều cần đăng nhập
router.use(authenticate);

router.get("/status", rewardController.getStatus);
router.post("/check-in", rewardController.checkIn);
router.post("/redeem", rewardController.redeem);

export default router;
