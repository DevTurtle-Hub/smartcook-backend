import { OAuth2Client } from "google-auth-library";
import { userRepository } from "../repositories/user.repository";
import { IUser, IUserPreferences } from "../models/User";
import { JwtHelper, AuthTokens } from "../utils/jwt";
import { env } from "../config/env";
import {
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
        const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken,
          audience: env.GOOGLE_CLIENT_ID,
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
}

export const authService = new AuthService();
export default authService;
