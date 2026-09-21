import { Types } from "mongoose";
import { chatRepository } from "../repositories/chat.repository";
import { userRepository } from "../repositories/user.repository";
import { BadRequestError, NotFoundError } from "../utils/errors";

export class ChatService {
  /**
   * Format relative friendly time
   */
  private formatRelativeTime(date?: Date): string {
    if (!date) return "Vừa xong";
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hôm qua";
    return `${diffDays} ngày trước`;
  }

  /**
   * Format message timestamp (e.g. "14:30")
   */
  private formatTimestamp(date: Date): string {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  /**
   * Map User document into CommunityAuthor DTO
   */
  private mapToAuthor(user: any) {
    if (!user) {
      return {
        id: "unknown",
        name: "Người dùng",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
        badge: "Thành Viên",
        isChef: false,
      };
    }
    const id = user._id ? user._id.toString() : user.id;
    return {
      id,
      name:
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        "Đầu bếp SmartCook",
      avatar:
        user.avatar ||
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      badge: user.level || "Đầu Bếp Tại Gia",
      isChef: user.level === "Bếp trưởng" || user.level === "Đầu bếp tài ba",
    };
  }

  /**
   * Get all public community chat rooms
   */
  async getCommunityRooms() {
    const rooms = await chatRepository.findRooms();
    return rooms.map((r) => ({
      id: r._id.toString(),
      roomCode: r.roomCode,
      title: r.title,
      description: r.description,
      iconName: r.iconName,
      tags: r.tags,
      activeMembers: r.activeMembers,
      lastMessage: r.lastMessage,
      lastMessageTime: this.formatRelativeTime(r.lastMessageTime),
      unreadCount: 0,
      isAiBot: r.isAiBot,
    }));
  }

  /**
   * Get direct conversations of current user
   */
  async getUserDirectConversations(currentUserId: string) {
    const conversations = await chatRepository.findDirectConversations(currentUserId);

    return conversations.map((conv) => {
      const otherUser = (conv.participants as any[]).find(
        (p) => (p._id ? p._id.toString() : p.toString()) !== currentUserId
      );

      return {
        id: otherUser?._id ? otherUser._id.toString() : conv._id.toString(),
        conversationId: conv._id.toString(),
        user: this.mapToAuthor(otherUser),
        lastMessage: conv.lastMessage || "Chưa có tin nhắn",
        lastMessageTime: this.formatRelativeTime(conv.lastMessageTime),
        unreadCount: 0,
        isOnline: true,
      };
    });
  }

  /**
   * Get or create 1-1 conversation with target user
   */
  async getOrCreateDirectChat(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new BadRequestError("Không thể tạo cuộc trò chuyện với chính mình");
    }

    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError("Người dùng đối phương không tồn tại");
    }

    const conversation = await chatRepository.findOrCreateDirectConversation(
      currentUserId,
      targetUserId
    );

    const otherUser = (conversation.participants as any[]).find(
      (p) => (p._id ? p._id.toString() : p.toString()) !== currentUserId
    );

    return {
      conversationId: conversation._id.toString(),
      id: otherUser?._id ? otherUser._id.toString() : targetUserId,
      user: this.mapToAuthor(otherUser || targetUser),
      lastMessage: conversation.lastMessage || "",
      lastMessageTime: this.formatRelativeTime(conversation.lastMessageTime),
    };
  }

  /**
   * Send a chat message (via REST or WebSocket)
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    text: string,
    imageUri?: string
  ) {
    if (!text && !imageUri) {
      throw new BadRequestError("Nội dung tin nhắn không được để trống");
    }

    const conversation = await chatRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError("Cuộc hội thoại hoặc phòng chat không tồn tại");
    }

    const message = await chatRepository.saveMessage({
      conversationId: new Types.ObjectId(conversationId) as any,
      sender: new Types.ObjectId(senderId) as any,
      text: text?.trim() || "",
      imageUri,
      readBy: [new Types.ObjectId(senderId) as any],
    });

    return {
      id: message._id.toString(),
      conversationId,
      sender: this.mapToAuthor(message.sender),
      text: message.text,
      imageUri: message.imageUri,
      timestamp: this.formatTimestamp(message.createdAt),
      isMe: true,
      createdAt: message.createdAt,
    };
  }

  /**
   * Get message history for conversation
   */
  async getMessages(
    conversationId: string,
    currentUserId: string,
    limit = 50,
    before?: Date
  ) {
    const conversation = await chatRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError("Cuộc hội thoại hoặc phòng chat không tồn tại");
    }

    const messages = await chatRepository.getMessages(conversationId, limit, before);

    return messages.map((m) => {
      const sId = m.sender && typeof m.sender === "object" && (m.sender as any)._id
        ? (m.sender as any)._id.toString()
        : (m.sender as any)?.toString();

      return {
        id: m._id.toString(),
        conversationId,
        sender: this.mapToAuthor(m.sender),
        text: m.text,
        imageUri: m.imageUri,
        timestamp: this.formatTimestamp(m.createdAt),
        isMe: sId === currentUserId,
        createdAt: m.createdAt,
      };
    });
  }
}

export const chatService = new ChatService();
export default chatService;
