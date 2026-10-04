import { Request, Response } from "express";
import { systemSettingService } from "../services/systemSetting.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/response";

export class SystemSettingController {
  /**
   * GET /api/v1/admin/settings
   */
  getSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await systemSettingService.getSettings();
    ApiResponse.success(res, settings, "Lấy cấu hình hệ thống thành công");
  });

  /**
   * PATCH /api/v1/admin/settings
   */
  updateSettings = asyncHandler(async (req: Request, res: Response) => {
    const updated = await systemSettingService.updateSettings(req.body);
    ApiResponse.success(res, updated, "Cập nhật cấu hình hệ thống thành công");
  });

  /**
   * GET /api/v1/admin/ai-engine/config
   */
  getAIEngineConfig = asyncHandler(async (_req: Request, res: Response) => {
    const config = await systemSettingService.getAIEngineConfig();
    ApiResponse.success(res, config, "Lấy cấu hình mô hình AI thành công");
  });

  /**
   * PATCH /api/v1/admin/ai-engine/config
   */
  updateAIEngineConfig = asyncHandler(async (req: Request, res: Response) => {
    const updated = await systemSettingService.updateAIEngineConfig(req.body);
    ApiResponse.success(res, updated, "Cập nhật cấu hình mô hình AI thành công");
  });

  /**
   * GET /api/v1/admin/ai-engine/status
   */
  getAIEngineStatus = asyncHandler(async (_req: Request, res: Response) => {
    const status = await systemSettingService.getAIEngineStatus();
    ApiResponse.success(res, status, "Kiểm tra trạng thái kết nối AI Engine thành công");
  });
}

export const systemSettingController = new SystemSettingController();
export default systemSettingController;
