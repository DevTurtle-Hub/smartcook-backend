import { Request, Response } from "express";
import { cookingHistoryService } from "../services/cookingHistory.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export class CookingHistoryController {
  record = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const result = await cookingHistoryService.recordCooking(userId, req.body);
    ApiResponse.created(
      res,
      result,
      result.leveledUp
        ? `Chúc mừng! Bạn đã hoàn thành món ăn, nhận +${result.xpEarned} XP và thăng hạng lên "${result.level}"!`
        : `Tuyệt vời! Bạn đã hoàn thành món ăn và nhận +${result.xpEarned} XP!`
    );
  });

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const page = parseInt(req.query.page as string, 10) || 1;

    const result = await cookingHistoryService.getCookingHistory(
      userId,
      limit,
      page
    );
    ApiResponse.success(res, result, "Cooking history retrieved successfully");
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const userRole = req.user?.role || "user";
    const { id } = req.params as { id: string };

    await cookingHistoryService.deleteCookingHistory(id, userId, userRole);
    ApiResponse.success(res, null, "Cooking history record deleted successfully");
  });
}

export const cookingHistoryController = new CookingHistoryController();
export default cookingHistoryController;
