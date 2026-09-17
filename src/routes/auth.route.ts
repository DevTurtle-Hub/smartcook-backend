import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/auth";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  onboardingSurveySchema,
  updateProfileSchema,
} from "../validators/auth.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and User Profile Management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Van Loi
 *               lastName:
 *                 type: string
 *                 example: Dinh
 *               email:
 *                 type: string
 *                 example: user@smartcook.vn
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       201:
 *         description: Account registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
router.post("/register", validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in to account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@smartcook.vn
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh JWT Access Token using Refresh Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out current user session
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current logged-in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, authController.getMe);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update profile info (Name, Avatar)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile
);

/**
 * @swagger
 * /auth/survey:
 *   post:
 *     summary: Save onboarding survey taste preferences
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               portion:
 *                 type: string
 *                 enum: ["1", "2", "3-4", "5+"]
 *               cuisines:
 *                 type: array
 *                 items:
 *                   type: string
 *               healthGoal:
 *                 type: string
 *                 enum: ["healthy", "loss", "muscle", "budget"]
 *               restrictions:
 *                 type: array
 *                 items:
 *                   type: string
 *               tasteProfile:
 *                 type: array
 *                 items:
 *                   type: string
 *               cookingTime:
 *                 type: string
 *                 enum: ["quick", "medium", "standard", "slow"]
 *     responses:
 *       200:
 *         description: Survey saved successfully
 */
router.post(
  "/survey",
  authenticate,
  validate(onboardingSurveySchema),
  authController.updateSurvey
);

export default router;
