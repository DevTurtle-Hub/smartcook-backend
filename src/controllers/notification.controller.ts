import { Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export class NotificationController {
  getNotifications = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await notificationService.getUserNotifications(
        userId,
        page,
        limit
      );
      ApiResponse.success(res, result, "Notifications fetched successfully");
    }
  );

  markAsRead = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const id = req.params.id as string;

      const updated = await notificationService.markAsRead(id, userId);
      ApiResponse.success(res, updated, "Notification marked as read");
    }
  );

  markAllAsRead = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();

      await notificationService.markAllAsRead(userId);
      ApiResponse.success(res, null, "All notifications marked as read");
    }
  );

  deleteNotification = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const id = req.params.id as string;

      await notificationService.deleteNotification(id, userId);
      ApiResponse.success(res, null, "Notification deleted successfully");
    }
  );
}

export const notificationController = new NotificationController();
