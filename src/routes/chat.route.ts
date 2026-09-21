import { Router } from "express";
import { chatController } from "../controllers/chat.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

// All chat endpoints require JWT authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/chat/rooms
 * @desc    Get all community chat rooms
 * @access  Private
 */
router.get("/rooms", chatController.getRooms);

/**
 * @route   GET /api/v1/chat/conversations
 * @desc    Get user's direct messaging conversations
 * @access  Private
 */
router.get("/conversations", chatController.getUserConversations);

/**
 * @route   POST /api/v1/chat/direct
 * @desc    Get or create 1-1 direct conversation
 * @access  Private
 */
router.post("/direct", chatController.getOrCreateDirectChat);

/**
 * @route   GET /api/v1/chat/conversations/:id/messages
 * @desc    Get message history of a conversation or room
 * @access  Private
 */
router.get("/conversations/:id/messages", chatController.getMessages);

/**
 * @route   POST /api/v1/chat/conversations/:id/messages
 * @desc    Send a message via REST fallback
 * @access  Private
 */
router.post("/conversations/:id/messages", chatController.sendMessage);

export default router;
