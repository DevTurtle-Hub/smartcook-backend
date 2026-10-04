import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  getUsersQuerySchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
} from "../validators/admin.validator";
import { reportController } from "../controllers/report.controller";
import {
  getReportsQuerySchema,
  resolveReportSchema,
} from "../validators/report.validator";
import { systemSettingController } from "../controllers/systemSetting.controller";

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

// 5. Quản lý & duyệt báo cáo vi phạm
router.get("/reports", validate(getReportsQuerySchema, "query"), reportController.getReports);
router.get("/reports/:id", reportController.getReportById);
router.patch("/reports/:id", validate(resolveReportSchema), reportController.resolveReport);

// 6. Cấu hình hệ thống & API Keys
router.get("/settings", systemSettingController.getSettings);
router.patch("/settings", systemSettingController.updateSettings);

// 7. Cấu hình & giám sát AI Engine
router.get("/ai-engine/config", systemSettingController.getAIEngineConfig);
router.patch("/ai-engine/config", systemSettingController.updateAIEngineConfig);
router.get("/ai-engine/status", systemSettingController.getAIEngineStatus);

export default router;
