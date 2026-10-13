import { Request, Response } from "express";
import { plannerService } from "../services/planner.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { getIO } from "../socket/chat.gateway";

const notifyCartUpdated = (userId: string, action: string, data?: any) => {
  try {
    getIO().to(`user_${userId}`).emit("cart_updated", { action, data });
    console.log(`📡 [Socket.io] Emitted 'cart_updated' (${action}) to user_${userId}`);
  } catch (err: any) {
    console.warn("⚠️ [Socket.io] notifyCartUpdated warning:", err.message);
  }
};

export class PlannerController {
  /**
   * GET /api/v1/planner/current-week
   */
  getCurrentWeekPlan = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const weekDate = req.query.weekDate as string | undefined;

      const plan = await plannerService.getWeeklyPlan(userId, weekDate);

      ApiResponse.success(
        res,
        plan,
        "Lấy kế hoạch thực đơn tuần thành công",
        200
      );
    }
  );

  /**
   * PUT /api/v1/planner/meals
   */
  setMealSlot = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const result = await plannerService.setMealSlot(userId, req.body);

      ApiResponse.success(
        res,
        result,
        "Cập nhật bữa ăn trong thực đơn thành công",
        200
      );
    }
  );

  /**
   * DELETE /api/v1/planner/meals
   */
  removeMealSlot = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const { dayOfWeek, slot, weekDate } = req.query as {
        dayOfWeek: string;
        slot: string;
        weekDate?: string;
      };

      const result = await plannerService.removeMealSlot(
        userId,
        dayOfWeek,
        slot,
        weekDate
      );

      ApiResponse.success(
        res,
        result,
        "Xoá bữa ăn khỏi thực đơn thành công",
        200
      );
    }
  );

  /**
   * GET /api/v1/planner/shopping-list
   */
  getShoppingList = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const weekDate = req.query.weekDate as string | undefined;

      const result = await plannerService.getSmartShoppingList(userId, weekDate);

      ApiResponse.success(
        res,
        result,
        "Tự động sinh danh mục đi chợ thông minh thành công",
        200
      );
    }
  );

  /**
   * POST /api/v1/planner/shopping-list
   */
  addCartItem = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const item = await plannerService.addCartItem(userId, req.body);
      notifyCartUpdated(userId, "add", item);

      ApiResponse.created(
        res,
        item,
        "Thêm nguyên liệu vào giỏ đi chợ thành công"
      );
    }
  );

  /**
   * PATCH /api/v1/planner/shopping-list/:id/bought
   */
  updateBoughtStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const rawId = req.params.id as string;
      const id = decodeURIComponent(rawId);
      const { bought } = req.body;

      const item = await plannerService.updateBoughtStatus(id, userId, bought);
      notifyCartUpdated(userId, "update_bought", item);

      ApiResponse.success(
        res,
        item,
        "Cập nhật trạng thái đã mua thành công",
        200
      );
    }
  );

  /**
   * DELETE /api/v1/planner/shopping-list/:id
   */
  removeCartItem = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const rawId = req.params.id as string;
      const id = decodeURIComponent(rawId);

      await plannerService.removeCartItem(id, userId);
      notifyCartUpdated(userId, "remove", { id });

      ApiResponse.success(
        res,
        null,
        "Xoá mục đi chợ thành công",
        200
      );
    }
  );

  /**
   * DELETE /api/v1/planner/shopping-list/clear-bought
   */
  clearBoughtItems = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const result = await plannerService.clearBoughtItems(userId);
      notifyCartUpdated(userId, "clear_bought", result);

      ApiResponse.success(
        res,
        result,
        "Dọn dẹp các mục đã mua thành công",
        200
      );
    }
  );

  /**
   * DELETE /api/v1/planner/shopping-list/clear-all
   */
  clearAllCartItems = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const result = await plannerService.clearAllCartItems(userId);
      notifyCartUpdated(userId, "clear_all", result);

      ApiResponse.success(
        res,
        result,
        "Xóa tất cả nguyên liệu trong giỏ thành công",
        200
      );
    }
  );

  /**
   * POST /api/v1/planner/sync-to-fridge
   */
  syncBoughtToFridge = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const userId = req.user!._id.toString();
      const result = await plannerService.syncBoughtToFridge(userId);
      notifyCartUpdated(userId, "sync_to_fridge", result);

      ApiResponse.success(
        res,
        result,
        "Đồng bộ thực phẩm đã mua vào Tủ Lạnh thành công",
        200
      );
    }
  );
}

export const plannerController = new PlannerController();
