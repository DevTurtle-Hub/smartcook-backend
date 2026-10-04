import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await authService.register(req.body);
    ApiResponse.created(res, result, "Account registered successfully");
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await authService.login(req.body);
    ApiResponse.success(res, result, "Login successful");
  });

  googleLogin = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { idToken } = req.body;
      const result = await authService.loginWithGoogle(idToken);
      ApiResponse.success(res, result, "Google authentication successful");
    }
  );

  refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      ApiResponse.success(res, result, "Tokens refreshed successfully");
    }
  );

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (req.user) {
      await authService.logout(req.user._id.toString());
    }
    ApiResponse.success(res, null, "Logged out successfully");
  });

  getMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const profile = await authService.getProfile(req.user!._id.toString());
    ApiResponse.success(res, profile, "Profile fetched successfully");
  });

  updateSurvey = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const updatedPreferences = await authService.updatePreferences(
        req.user!._id.toString(),
        req.body
      );
      ApiResponse.success(
        res,
        updatedPreferences,
        "Survey preferences saved successfully"
      );
    }
  );

  updateProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const updatedUser = await authService.updateProfile(
        req.user!._id.toString(),
        req.body
      );
      ApiResponse.success(res, updatedUser, "Profile updated successfully");
    }
  );

  forgotPassword = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await authService.forgotPassword(req.body.email);
      ApiResponse.success(res, null, result.message);
    }
  );

  verifyOtp = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await authService.verifyOtp(req.body.email, req.body.otp);
      ApiResponse.success(res, result, result.message);
    }
  );

  resetPassword = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const result = await authService.resetPassword(
        req.body.email,
        req.body.otp,
        req.body.newPassword
      );
      ApiResponse.success(res, null, result.message);
    }
  );
}

export const authController = new AuthController();
export default authController;
