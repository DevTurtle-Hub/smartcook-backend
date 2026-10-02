import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { chatService } from "../services/chat.service";
import { chatRepository } from "../repositories/chat.repository";
import { AuthenticatedSocket, socketAuthMiddleware } from "./socketAuth";

let io: SocketIOServer | null = null;

// Track active online users: userId -> Set of socket IDs
const onlineUsers = new Map<string, Set<string>>();

export const initSocketIO = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Allow mobile Expo, web Vite and test scripts
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Authentication middleware
  io.use(socketAuthMiddleware);

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const userId = socket.data?.userId;

    if (userId) {
      // Register online user
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);

      // Join personal user room for direct notifications
      socket.join(`user_${userId}`);
      console.log(`🔌 [Socket.io] User connected: ${userId} (Socket: ${socket.id})`);
    } else {
      console.log(`🌐 [Socket.io] Guest connected: (Socket: ${socket.id})`);
    }

    /**
     * Join conversation room (1-1 direct chat or public community room)
     */
    socket.on("join_room", (data: { conversationId: string }) => {
      if (!data?.conversationId) return;
      const roomKey = `conv_${data.conversationId}`;
      socket.join(roomKey);
      console.log(`👥 [Socket.io] User ${userId} joined room ${roomKey}`);
    });

    /**
     * Leave conversation room
     */
    socket.on("leave_room", (data: { conversationId: string }) => {
      if (!data?.conversationId) return;
      const roomKey = `conv_${data.conversationId}`;
      socket.leave(roomKey);
      console.log(`👋 [Socket.io] User ${userId} left room ${roomKey}`);
    });

    /**
     * Send realtime chat message
     */
    socket.on(
      "send_message",
      async (
        data: { conversationId: string; text: string; imageUri?: string },
        callback?: (res: any) => void
      ) => {
        try {
          if (!userId) {
            if (callback) callback({ success: false, error: "Unauthorized" });
            return;
          }

          if (!data?.conversationId || (!data.text && !data.imageUri)) {
            if (callback) callback({ success: false, error: "Invalid message payload" });
            return;
          }

          const message = await chatService.sendMessage(
            data.conversationId,
            userId,
            data.text,
            data.imageUri
          );

          const roomKey = `conv_${data.conversationId}`;
          // Broadcast to everyone in conversation and user rooms EXCEPT the sender socket
          let broadcaster = socket.to(roomKey);

          // Also broadcast to each participant's user room to update conversation list/unread count
          try {
            const conversation = await chatRepository.findById(data.conversationId);
            if (conversation && conversation.participants) {
              for (const p of conversation.participants) {
                const pId = (p._id || p).toString();
                broadcaster = broadcaster.to(`user_${pId}`);
              }
            }
          } catch (e) {
            // Ignore participant lookup error
          }

          broadcaster.emit("new_message", message);

          if (callback) {
            callback({ success: true, data: message });
          }
        } catch (error: any) {
          console.error("❌ [Socket.io] Send message error:", error.message || error);
          if (callback) {
            callback({ success: false, error: error.message || "Failed to send message" });
          }
        }
      }
    );

    /**
     * Typing indicators
     */
    socket.on("typing", (data: { conversationId: string }) => {
      if (!data?.conversationId) return;
      socket.to(`conv_${data.conversationId}`).emit("user_typing", {
        conversationId: data.conversationId,
        userId,
        userName: socket.data.user?.fullName || "Ai đó",
      });
    });

    socket.on("stop_typing", (data: { conversationId: string }) => {
      if (!data?.conversationId) return;
      socket.to(`conv_${data.conversationId}`).emit("user_stop_typing", {
        conversationId: data.conversationId,
        userId,
      });
    });

    /**
     * Disconnect
     */
    socket.on("disconnect", () => {
      if (userId) {
        const userSockets = onlineUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            onlineUsers.delete(userId);
          }
        }
        console.log(`❌ [Socket.io] User disconnected: ${userId} (Socket: ${socket.id})`);
      } else {
        console.log(`🌐 [Socket.io] Guest disconnected: (Socket: ${socket.id})`);
      }
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.io is not initialized! Call initSocketIO(server) first.");
  }
  return io;
};
