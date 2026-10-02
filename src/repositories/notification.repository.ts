import mongoose from "mongoose";
import { INotification, Notification } from "../models/Notification";

export class NotificationRepository {
  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: INotification[]; total: number }> {
    const skip = (page - 1) * limit;
    const query = { userId: new mongoose.Types.ObjectId(userId) };

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
    ]);

    return { notifications: notifications as INotification[], total };
  }

  async countUnread(userId: string): Promise<number> {
    return Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });
  }

  async create(data: Partial<INotification>): Promise<INotification> {
    return Notification.create(data);
  }

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      { isRead: true }
    );
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await Notification.deleteOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(userId),
    });
    return result.deletedCount > 0;
  }
}

export const notificationRepository = new NotificationRepository();
