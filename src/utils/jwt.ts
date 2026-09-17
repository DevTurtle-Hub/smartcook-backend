import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import { UnauthorizedError } from "./errors";

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export class JwtHelper {
  static generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    // RFC 7519: Add unique jti (JWT ID) to ensure refresh tokens are always unique
    const refreshToken = jwt.sign(
      {
        ...payload,
        jti: crypto.randomUUID(),
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: env.JWT_EXPIRES_IN,
    };
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new UnauthorizedError("Access token expired");
      }
      throw new UnauthorizedError("Invalid access token");
    }
  }

  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new UnauthorizedError("Refresh token expired. Please log in again.");
      }
      throw new UnauthorizedError("Invalid refresh token");
    }
  }
}

export default JwtHelper;
