import mongoose from "mongoose";
import { INotification, NotificationType } from "../models/Notification";
import { notificationRepository } from "../repositories/notification.repository";
import { getIO } from "../socket/chat.gateway";

export interface PushNotificationPayload {
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
}

export class NotificationService {
  /**
   * Lấy danh sách thông báo của người dùng kèm đếm số tin chưa đọc.
   * Tự động sinh thông báo ban đầu thân thiện nếu người dùng chưa có thông báo nào.
   */
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
  }> {
    let result = await notificationRepository.findByUser(userId, page, limit);

    // Nếu chưa có thông báo nào, tự động tạo các thông báo chào mừng & nhắc nhở hữu ích
    if (result.total === 0) {
      await this.seedWelcomeNotifications(userId);
      result = await notificationRepository.findByUser(userId, page, limit);
    }

    const unreadCount = await notificationRepository.countUnread(userId);

    return {
      notifications: result.notifications,
      total: result.total,
      unreadCount,
    };
  }

  /**
   * Đánh dấu 1 thông báo đã đọc
   */
  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return notificationRepository.markAsRead(id, userId);
  }

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  async markAllAsRead(userId: string): Promise<void> {
    await notificationRepository.markAllAsRead(userId);
  }

  /**
   * Xóa một thông báo
   */
  async deleteNotification(id: string, userId: string): Promise<boolean> {
    return notificationRepository.delete(id, userId);
  }

  /**
   * Tạo thông báo và PUSH REALTIME qua Socket.io tới thiết bị người dùng
   */
  async pushNotification(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<INotification> {
    const notification = await notificationRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      title: payload.title,
      body: payload.body,
      type: payload.type,
      data: payload.data || {},
      isRead: false,
    });

    // Phát sự kiện realtime qua Socket.io
    try {
      const io = getIO();
      if (io) {
        io.to(`user_${userId}`).emit("new_notification", {
          id: notification._id.toString(),
          _id: notification._id.toString(),
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: notification.data,
          isRead: false,
          createdAt: notification.createdAt,
        });
        console.log(`🔔 [Socket.io] Realtime notification emitted to user_${userId}: "${notification.title}"`);
      }
    } catch (socketErr) {
      // Socket.io có thể chưa khởi tạo trong môi trường test script, bỏ qua lỗi
    }

    return notification;
  }

  /**
   * Tạo bộ thông báo khởi đầu đẹp mắt
   */
  private async seedWelcomeNotifications(userId: string): Promise<void> {
    const welcomeList: PushNotificationPayload[] = [
      {
        title: "Chào mừng bạn đến với SmartCook! 🎉",
        body: "Khám phá hàng ngàn công thức nấu ăn ngon, quản lý tủ lạnh thông minh và kết nối cộng đồng yêu ẩm thực.",
        type: "system",
        data: { route: "/home" },
      },
      {
        title: "🎁 Nhận quà điểm danh hàng ngày",
        body: "Đừng quên mở Hộp Quà để điểm danh nhận điểm thưởng Chef XP và voucher siêu thị mỗi ngày!",
        type: "reward",
        data: { route: "rewards" },
      },
      {
        title: "🧊 Nhắc nhở hạn sử dụng nguyên liệu",
        body: "Kiểm tra tủ lạnh của bạn để lên kế hoạch nấu ăn trước khi thực phẩm quá hạn nhé.",
        type: "fridge_expiry",
        data: { route: "/fridge" },
      },
    ];

    for (const item of welcomeList) {
      await notificationRepository.create({
        userId: new mongoose.Types.ObjectId(userId),
        title: item.title,
        body: item.body,
        type: item.type,
        data: item.data || {},
        isRead: false,
      });
    }
  }
}

export const notificationService = new NotificationService();
