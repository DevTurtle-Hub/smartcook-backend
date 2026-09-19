import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  getUsersQuerySchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
} from "../validators/admin.validator";

const router = Router();

// Tất cả endpoints admin đều yêu cầu đăng nhập và có role là "admin"
router.use(authenticate, authorize("admin"));

// 1. Thống kê tổng quan Dashboard
router.get("/dashboard", adminController.getDashboardStats);

// 2. Quản lý danh sách thành viên
router.get("/users", validate(getUsersQuerySchema, "query"), adminController.getUsers);

// 3. Khóa / mở khóa tài khoản thành viên
router.patch(
  "/users/:userId/status",
  validate(updateUserStatusSchema),
  adminController.toggleUserStatus
);

// 4. Phân quyền thành viên (user / admin)
router.patch(
  "/users/:userId/role",
  validate(updateUserRoleSchema),
  adminController.updateUserRole
);

export default router;
