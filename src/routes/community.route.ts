import { Router } from "express";
import { communityController } from "../controllers/community.controller";
import { authenticate, optionalAuthenticate } from "../middlewares/auth";
import { uploadMultipleImages } from "../middlewares/upload";

const router = Router();

/**
 * @route   GET /api/v1/posts or /api/v1/community/posts
 * @desc    Get paginated community posts
 * @access  Public / Optional Auth
 */
router.get("/", optionalAuthenticate, communityController.getPosts);

/**
 * @route   POST /api/v1/posts or /api/v1/community/posts
 * @desc    Create a new community post
 * @access  Private
 */
router.post("/", authenticate, uploadMultipleImages, communityController.createPost);

/**
 * @route   GET /api/v1/posts/:id
 * @desc    Get post details
 * @access  Public / Optional Auth
 */
router.get("/:id", optionalAuthenticate, communityController.getPostById);

/**
 * @route   POST /api/v1/posts/:id/react
 * @desc    React to a post ('like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry')
 * @access  Private
 */
router.post("/:id/react", authenticate, communityController.reactPost);

/**
 * @route   POST /api/v1/posts/:id/like
 * @desc    Mobile alias to like a post
 * @access  Private
 */
router.post("/:id/like", authenticate, communityController.likePost);

/**
 * @route   POST /api/v1/posts/:id/comments
 * @desc    Add comment to a post
 * @access  Private
 */
router.post("/:id/comments", authenticate, communityController.addComment);

/**
 * @route   GET /api/v1/posts/:id/comments
 * @desc    Get comments of a post
 * @access  Public
 */
router.get("/:id/comments", communityController.getComments);

/**
 * @route   DELETE /api/v1/posts/:id
 * @desc    Delete post (Owner or Admin)
 * @access  Private
 */
router.delete("/:id", authenticate, communityController.deletePost);

/**
 * @route   PATCH /api/v1/posts/:id/pin
 * @desc    Toggle pin post (Admin only)
 * @access  Private (Admin)
 */
router.patch("/:id/pin", authenticate, communityController.togglePin);

/**
 * @route   PATCH /api/v1/posts/:id/status
 * @desc    Update post status (Admin only)
 * @access  Private (Admin)
 */
router.patch("/:id/status", authenticate, communityController.updateStatus);

export default router;
