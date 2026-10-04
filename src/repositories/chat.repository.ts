import { Types } from "mongoose";
import Conversation, { IConversation } from "../models/Conversation";
import Message, { IMessage } from "../models/Message";

export class ChatRepository {
  /**
   * Get all community chat rooms
   */
  async findRooms(): Promise<IConversation[]> {
    return await Conversation.find({ type: "room" })
      .sort({ activeMembers: -1, updatedAt: -1 })
      .exec();
  }

  /**
   * Find direct conversations of a user
   */
  async findDirectConversations(userId: string): Promise<IConversation[]> {
    const userObjId = new Types.ObjectId(userId);
    return await Conversation.find({
      type: "direct",
      participants: userObjId,
    })
      .populate("participants", "firstName lastName fullName avatar level role")
      .sort({ updatedAt: -1 })
      .exec();
  }

  /**
   * Find or create 1-1 direct conversation between two users
   */
  async findOrCreateDirectConversation(
    userAId: string,
    userBId: string
  ): Promise<IConversation> {
    const objA = new Types.ObjectId(userAId);
    const objB = new Types.ObjectId(userBId);

    let conversation = await Conversation.findOne({
      type: "direct",
      participants: { $all: [objA, objB] },
    })
      .populate("participants", "firstName lastName fullName avatar level role")
      .exec();

    if (!conversation) {
      conversation = new Conversation({
        type: "direct",
        participants: [objA, objB],
        members: [
          { userId: objA, joinedAt: new Date() },
          { userId: objB, joinedAt: new Date() },
        ],
        activeMembers: 2,
        lastMessage: "Bắt đầu cuộc trò chuyện mới",
        lastMessageTime: new Date(),
      });
      await conversation.save();
      await conversation.populate("participants", "firstName lastName fullName avatar level role");
    }

    return conversation;
  }

  /**
   * Find conversation by ID
   */
  async findById(conversationId: string): Promise<IConversation | null> {
    if (!Types.ObjectId.isValid(conversationId)) return null;
    return await Conversation.findById(conversationId)
      .populate("participants", "firstName lastName fullName avatar level role")
      .exec();
  }

  /**
   * Save message and update conversation's last message metadata
   */
  async saveMessage(data: Partial<IMessage>): Promise<IMessage> {
    const message = new Message(data);
    await message.save();

    await Conversation.findByIdAndUpdate(data.conversationId, {
      lastMessage: data.text || (data.imageUri ? "[Hình ảnh]" : ""),
      lastMessageTime: new Date(),
      lastSender: data.sender,
    }).exec();

    return await message.populate("sender", "firstName lastName fullName avatar level role");
  }

  /**
   * Get message history of a conversation (chronological asc)
   */
  async getMessages(
    conversationId: string,
    limit = 50,
    before?: Date
  ): Promise<IMessage[]> {
    if (!Types.ObjectId.isValid(conversationId)) return [];

    const query: Record<string, any> = {
      conversationId: new Types.ObjectId(conversationId),
    };

    if (before) {
      query.createdAt = { $lt: before };
    }

    const messages = await Message.find(query)
      .populate("sender", "firstName lastName fullName avatar level role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return messages.reverse(); // Return oldest to newest for chat UI
  }
}

export const chatRepository = new ChatRepository();
export default chatRepository;
