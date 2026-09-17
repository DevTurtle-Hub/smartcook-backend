import { Request, Response, NextFunction } from "express";
import { JwtHelper } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { userRepository } from "../repositories/user.repository";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new UnauthorizedError("Authentication token is missing");
    }

    const decoded = JwtHelper.verifyAccessToken(token);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      throw new UnauthorizedError("User associated with this token no longer exists");
    }

    if (!user.isActive) {
      throw new ForbiddenError("Your account has been deactivated. Please contact support.");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError("Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `User role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

export default { authenticate, authorize };
