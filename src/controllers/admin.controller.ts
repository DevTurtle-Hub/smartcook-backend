import { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";

export class AdminController {
  getDashboardStats = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
      const stats = await adminService.getDashboardStats();
      ApiResponse.success(
        res,
        stats,
        "Lấy thống kê dashboard quản trị thành công"
      );
    }
  );

  getUsers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const page = req.query.page
        ? parseInt(req.query.page as string, 10)
        : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : undefined;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      let isActive: boolean | undefined = undefined;

      if (req.query.isActive !== undefined) {
        isActive = req.query.isActive === "true";
      }

      const result = await adminService.getUsers({
        page,
        limit,
        search,
        role,
        isActive,
      });

      ApiResponse.success(
        res,
        result,
        "Lấy danh sách người dùng thành công"
      );
    }
  );

  toggleUserStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params as { userId: string };
      const { isActive } = req.body as { isActive: boolean };

      const user = await adminService.toggleUserStatus(userId, isActive);
      ApiResponse.success(
        res,
        user,
        isActive
          ? "Đã kích hoạt tài khoản người dùng thành công"
          : "Đã vô hiệu hóa tài khoản người dùng thành công"
      );
    }
  );

  updateUserRole = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params as { userId: string };
      const { role } = req.body as { role: "user" | "admin" };

      const user = await adminService.updateUserRole(userId, role);
      ApiResponse.success(
        res,
        user,
        `Đã phân quyền ${role} cho người dùng thành công`
      );
    }
  );
}

export const adminController = new AdminController();
export default adminController;
