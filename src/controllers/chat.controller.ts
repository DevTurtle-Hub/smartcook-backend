import { Request, Response } from "express";
import { chatService } from "../services/chat.service";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError } from "../utils/errors";
import { ApiResponse } from "../utils/response";

export class ChatController {
  /**
   * GET /api/v1/chat/rooms
   */
  getRooms = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const rooms = await chatService.getCommunityRooms();
    ApiResponse.success(res, rooms, "Lấy danh sách phòng chat cộng đồng thành công");
  });

  /**
   * GET /api/v1/chat/conversations
   */
  getUserConversations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const conversations = await chatService.getUserDirectConversations(userId);
    ApiResponse.success(res, conversations, "Lấy danh sách cuộc trò chuyện thành công");
  });

  /**
   * POST /api/v1/chat/direct
   */
  getOrCreateDirectChat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const { targetUserId } = req.body;

    if (!targetUserId) {
      throw new BadRequestError("targetUserId là bắt buộc");
    }

    const conversation = await chatService.getOrCreateDirectChat(userId, targetUserId);
    ApiResponse.created(res, conversation, "Khởi tạo cuộc trò chuyện thành công");
  });

  /**
   * GET /api/v1/chat/conversations/:id/messages
   */
  getMessages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const userId = req.user!._id.toString();
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const beforeStr = req.query.before as string | undefined;
    const before = beforeStr ? new Date(beforeStr) : undefined;

    const messages = await chatService.getMessages(id, userId, limit, before);
    ApiResponse.success(res, messages, "Lấy lịch sử tin nhắn thành công");
  });

  /**
   * POST /api/v1/chat/conversations/:id/messages
   */
  sendMessage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const userId = req.user!._id.toString();
    const { text, imageUri } = req.body;

    const message = await chatService.sendMessage(id, userId, text, imageUri);

    // Broadcast realtime event to Socket.io clients
    try {
      const { getIO } = await import("../socket/chat.gateway");
      const { chatRepository } = await import("../repositories/chat.repository");
      const io = getIO();
      if (io) {
        let broadcaster = io.to(`conv_${id}`);
        const conversation = await chatRepository.findById(id);
        if (conversation && conversation.participants) {
          for (const p of conversation.participants) {
            const pId = (p._id || p).toString();
            broadcaster = broadcaster.to(`user_${pId}`);
          }
        }
        broadcaster.emit("new_message", message);
      }
    } catch (e) {
      // Ignore socket broadcasting failure if socket not initialized
    }

    ApiResponse.created(res, message, "Gửi tin nhắn thành công");
  });
}

export const chatController = new ChatController();
export default chatController;
