import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/auth";
import { authLimiter } from "../middlewares/rateLimit";
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  refreshTokenSchema,
  onboardingSurveySchema,
  updateProfileSchema,
} from "../validators/auth.validator";

const router = Router();

// Public Authentication Endpoints (protected by strict rate limiting)
router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/google", authLimiter, validate(googleAuthSchema), authController.googleLogin);
router.post("/refresh-token", authLimiter, validate(refreshTokenSchema), authController.refreshToken);

// Protected User Profile & Session Endpoints
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);
router.put("/profile", authenticate, validate(updateProfileSchema), authController.updateProfile);
router.post("/survey", authenticate, validate(onboardingSurveySchema), authController.updateSurvey);

export default router;
