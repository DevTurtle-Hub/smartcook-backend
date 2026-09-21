import { Socket } from "socket.io";
import { userRepository } from "../repositories/user.repository";
import { JwtHelper } from "../utils/jwt";

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    user: any;
  };
}

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
) => {
  try {
    const authHeader =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization ||
      socket.handshake.query?.token;

    if (!authHeader) {
      return next(new Error("Authentication error: Token is required for WebSocket connection"));
    }

    const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : (authHeader as string);

    if (!token) {
      return next(new Error("Authentication error: Token is missing"));
    }

    const decoded = JwtHelper.verifyAccessToken(token);
    const user = await userRepository.findById(decoded.id);

    if (!user || !user.isActive) {
      return next(new Error("Authentication error: User not found or deactivated"));
    }

    socket.data.userId = user._id.toString();
    socket.data.user = user;
    next();
  } catch (error: any) {
    next(new Error(`Authentication error: ${error.message || "Invalid token"}`));
  }
};
