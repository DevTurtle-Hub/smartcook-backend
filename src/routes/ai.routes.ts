import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";
import { uploadSingleImage } from "../middlewares/upload";

const router = Router();

/**
 * @route   POST /api/v1/ai/assistant-chat
 * @desc    Chat with AI Chef Assistant with fridge & user preferences context
 * @access  Public / Optional Authenticated
 */
router.post("/assistant-chat", optionalAuthenticate, aiController.assistantChat);

// Endpoints yêu cầu đăng nhập
router.use(authenticate);

/**
 * @route   POST /api/v1/ai/scan-ingredients
 * @desc    Upload food image, detect ingredients + pins and get suggested recipe
 * @access  Private
 */
router.post("/scan-ingredients", uploadSingleImage, aiController.scanIngredients);

/**
 * @route   GET /api/v1/ai/scan-history
 * @desc    Get user's past AI scan history
 * @access  Private
 */
router.get("/scan-history", aiController.getScanHistory);

/**
 * @route   DELETE /api/v1/ai/scan-history/:id
 * @desc    Delete a scan history entry
 * @access  Private
 */
router.delete("/scan-history/:id", aiController.deleteScanHistory);

export default router;
