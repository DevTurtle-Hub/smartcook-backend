import { Socket } from "socket.io";
import { userRepository } from "../repositories/user.repository";
import { JwtHelper } from "../utils/jwt";

export interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
    user?: any;
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
      // Allow unauthenticated guest connections for public live feeds (community, announcements)
      socket.data = { userId: undefined, user: null };
      return next();
    }

    const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : (authHeader as string);

    if (!token) {
      socket.data = { userId: undefined, user: null };
      return next();
    }

    const decoded = JwtHelper.verifyAccessToken(token);
    const user = await userRepository.findById(decoded.id);

    if (!user || !user.isActive) {
      socket.data = { userId: undefined, user: null };
      return next();
    }

    socket.data.userId = user._id.toString();
    socket.data.user = user;
    next();
  } catch (_error: any) {
    // If token expired or invalid, still allow as guest for public real-time events
    socket.data = { userId: undefined, user: null };
    next();
  }
};
