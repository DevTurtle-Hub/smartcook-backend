import { OAuth2Client } from "google-auth-library";
import { userRepository } from "../repositories/user.repository";
import { IUser, IUserPreferences } from "../models/User";
import { JwtHelper, AuthTokens } from "../utils/jwt";
import { env } from "../config/env";
import bcrypt from "bcryptjs";
import { deleteFromCloudinary, extractCloudinaryPublicId } from "../config/cloudinary";
import PasswordResetOtp from "../models/PasswordResetOtp";
import { emailService } from "./email.service";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
  InternalServerError,
} from "../utils/errors";

export interface RegisterDTO {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
}

export interface LoginDTO {
  email: string;
  password?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    avatar: string;
    role: string;
    chefExp: number;
    level: string;
    preferences: IUserPreferences;
  };
  tokens: AuthTokens;
}

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError("An account with this email already exists");
    }

    const newUser = await userRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
    });

    const tokens = JwtHelper.generateTokens({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
    });

    await userRepository.updateRefreshToken(
      newUser._id.toString(),
      tokens.refreshToken
    );

    return {
      user: this.formatUserResponse(newUser),
      tokens,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    const user = await userRepository.findByEmail(data.email, true);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new ForbiddenError(
        "Your account has been deactivated. Please contact support."
      );
    }

    const isMatch = await user.comparePassword(data.password || "");
    if (!isMatch) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const tokens = JwtHelper.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await userRepository.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken
    );

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new InternalServerError("Google OAuth Client ID is not configured on the server");
    }

    let payload;
    if (process.env.NODE_ENV === "development" && idToken === "dev_mock_google_id_token") {
      payload = {
        sub: "google_mock_id_9999",
        email: "google.tester@smartcook.com",
        given_name: "Google",
        family_name: "Tester",
        name: "Google Tester",
        picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80",
      };
    } else {
      try {
        const client = new OAuth2Client();
        const validAudiences = [
          env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_IOS_CLIENT_ID,
          process.env.GOOGLE_ANDROID_CLIENT_ID,
        ].filter(Boolean) as string[];

        const ticket = await client.verifyIdToken({
          idToken,
          audience: validAudiences.length === 1 ? validAudiences[0] : validAudiences,
        });
        payload = ticket.getPayload();
      } catch (error: any) {
        throw new UnauthorizedError(`Invalid Google ID Token: ${error.message || "Verification failed"}`);
      }
    }

    if (!payload || !payload.email) {
      throw new UnauthorizedError("Google ID Token does not contain a valid email");
    }

    const { sub: googleId, email, given_name, family_name, name, picture } = payload;

    // 1. Try finding by googleId
    let user = await userRepository.findByGoogleId(googleId);

    if (!user) {
      // 2. Try finding by email (Account Linking)
      const existingEmailUser = await userRepository.findByEmail(email);

      if (existingEmailUser) {
        user = await userRepository.linkGoogleId(
          existingEmailUser._id.toString(),
          googleId,
          !existingEmailUser.avatar ? picture : undefined
        );
      } else {
        // 3. Create new user with Google Auth
        const firstName = given_name || name?.split(" ")[0] || "User";
        const lastName = family_name || name?.split(" ").slice(1).join(" ") || "";

        user = await userRepository.create({
          firstName,
          lastName,
          email: email.toLowerCase().trim(),
          googleId,
          authType: "google",
          avatar: picture || "",
          level: "Tập sự",
          chefExp: 0,
        });
      }
    }

    if (!user) {
      throw new UnauthorizedError("Failed to authenticate with Google");
    }

    if (!user.isActive) {
      throw new ForbiddenError(
        "Your account has been deactivated. Please contact support."
      );
    }

    const tokens = JwtHelper.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await userRepository.updateRefreshToken(
      user._id.toString(),
      tokens.refreshToken
    );

    return {
      user: this.formatUserResponse(user),
      tokens,
    };
  }

  async refreshToken(token: string): Promise<AuthTokens> {
    const decoded = JwtHelper.verifyRefreshToken(token);

    const user = await userRepository.findById(decoded.id, true);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid or expired session. Please log in again.");
    }

    // Compare with token stored in DB (Rotation protection)
    if (user.refreshToken !== token) {
      // Possible token reuse / breach: revoke refresh token
      await userRepository.updateRefreshToken(user._id.toString(), null);
      throw new UnauthorizedError("Invalid refresh token. Session revoked.");
    }

    // Issue new token pair (Refresh Token Rotation)
    const newTokens = JwtHelper.generateTokens({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await userRepository.updateRefreshToken(
      user._id.toString(),
      newTokens.refreshToken
    );

    return newTokens;
  }

  async logout(userId: string): Promise<void> {
    await userRepository.updateRefreshToken(userId, null);
  }

  async getProfile(userId: string): Promise<any> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return this.formatUserResponse(user);
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<IUserPreferences>
  ): Promise<IUserPreferences> {
    const updatedUser = await userRepository.updatePreferences(
      userId,
      preferences
    );
    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }
    return updatedUser.preferences;
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; avatar?: string }
  ): Promise<any> {
    const existingUser = await userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError("User not found");
    }

    // If new avatar is provided and different from old avatar, clean up old Cloudinary avatar
    if (data.avatar && existingUser.avatar && data.avatar !== existingUser.avatar) {
      const oldPublicId = extractCloudinaryPublicId(existingUser.avatar);
      if (oldPublicId) {
        deleteFromCloudinary(oldPublicId).catch((err) =>
          console.warn(`[Cloudinary] Failed to delete old avatar ${oldPublicId}:`, err)
        );
      }
    }

    const updatedUser = await userRepository.update(userId, data);
    if (!updatedUser) {
      throw new NotFoundError("User not found");
    }
    return this.formatUserResponse(updatedUser);
  }

  private formatUserResponse(user: IUser) {
    const idStr = user._id.toString();
    return {
      _id: idStr,
      id: idStr,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName || `${user.firstName} ${user.lastName}`,
      avatar: user.avatar || "",
      role: user.role,
      chefExp: user.chefExp,
      level: user.level,
      preferences: user.preferences,
      favoriteRecipeIds: user.favoriteRecipeIds,
    };
  }

  /**
   * 1. Request password reset OTP
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(cleanEmail);

    // If user does not exist, return generic success message to prevent user enumeration attacks
    if (!user) {
      return {
        message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP xác thực.",
      };
    }

    // Invalidate existing active OTPs for this email
    await PasswordResetOtp.updateMany(
      { email: cleanEmail, isUsed: false },
      { $set: { isUsed: true } }
    ).exec();

    // Generate random 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(rawOtp, salt);

    // Save with 15-minute expiration
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await PasswordResetOtp.create({
      email: cleanEmail,
      otpHash,
      expiresAt,
      isUsed: false,
      attempts: 0,
    });

    // Send email with OTP
    await emailService.sendPasswordResetOtp(cleanEmail, rawOtp, user.fullName);

    return {
      message: "Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn.",
    };
  }

  /**
   * 2. Verify OTP
   */
  async verifyOtp(email: string, otp: string): Promise<{ valid: boolean; message: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const record = await PasswordResetOtp.findOne({
      email: cleanEmail,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .exec();

    if (!record) {
      throw new BadRequestError("Mã OTP không hợp lệ hoặc đã hết hạn (chỉ có hiệu lực trong 15 phút)");
    }

    if (record.attempts >= 5) {
      record.isUsed = true;
      await record.save();
      throw new BadRequestError("Bạn đã nhập sai mã OTP quá 5 lần. Vui lòng yêu cầu mã OTP mới.");
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch) {
      record.attempts += 1;
      await record.save();
      throw new BadRequestError(`Mã OTP không chính xác. Bạn còn ${5 - record.attempts} lần thử.`);
    }

    return {
      valid: true,
      message: "Mã OTP hợp lệ. Bạn có thể tiến hành đặt lại mật khẩu mới.",
    };
  }

  /**
   * 3. Reset Password
   */
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const cleanEmail = email.toLowerCase().trim();

    // 1. Re-verify OTP to ensure atomicity
    const record = await PasswordResetOtp.findOne({
      email: cleanEmail,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .exec();

    if (!record) {
      throw new BadRequestError("Mã OTP không hợp lệ hoặc đã hết hạn");
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch) {
      throw new BadRequestError("Mã OTP không chính xác");
    }

    // 2. Find user
    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      throw new NotFoundError("Tài khoản người dùng không tồn tại");
    }

    // 3. Mark OTP as used
    record.isUsed = true;
    await record.save();

    // 4. Update password & revoke existing refresh token
    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();

    return {
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới của bạn.",
    };
  }
}

export const authService = new AuthService();
export default authService;
