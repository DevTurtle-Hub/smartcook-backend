import { scanPhotoBodySchema } from "../validators/scan-photo.validator";
import { validateFoodPhoto } from "../services/food-vision.service";
import { Request, Response } from "express";
import { deleteFromCloudinary, uploadToCloudinary } from "../config/cloudinary";
import { aiService } from "../services/ai.service";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError, BadRequestError } from "../utils/errors";
import { ApiResponse } from "../utils/response";
import { cookingAudioService } from "../services/cooking-audio.service";

export class AIController {
  transcribeCookingAudio = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await cookingAudioService.transcribe(req.body.audioBase64, req.body.mimeType);
    ApiResponse.success(res, result, "Đã nhận diện giọng nói");
  });

  /**
   * Scan image for ingredients, detection pins and recipe suggestion
   * POST /api/v1/ai/scan-ingredients
   */
  scanIngredients = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();

    let buffer: Buffer | null = null;
    let mimeType = "image/jpeg";
    let imageUrl = "";
    let publicId: string | undefined = undefined;

    if (req.file) {
      buffer = req.file.buffer;
      mimeType = req.file.mimetype === "image/jpg" ? "image/jpeg" : req.file.mimetype;
    } else {
      const validation = scanPhotoBodySchema.validate(req.body, { stripUnknown: true });
      if (validation.error) throw new BadRequestError("Vui lòng gửi file ảnh hoặc dữ liệu ảnh JPEG, PNG, WEBP hợp lệ.");
      buffer = Buffer.from(validation.value.imageBase64, "base64");
      mimeType = validation.value.mimeType;
    }
    validateFoodPhoto(buffer, mimeType);
    try {
      const uploaded = await uploadToCloudinary(buffer, "smartcook/scans");
      imageUrl = uploaded.url;
      publicId = uploaded.publicId;
    } catch {
      throw new AppError("Chưa tải được ảnh lên máy chủ. Vui lòng thử lại.", 503);
    }

    try {
      const result = await aiService.scanIngredients(userId, buffer, mimeType, imageUrl, publicId);
      ApiResponse.created(res, result, "Quét và phân tích thực phẩm thành công");
    } catch (error) {
      // Only remove the new upload owned by this failed scan, never previous history images.
      if (publicId) await deleteFromCloudinary(publicId).catch(() => {});
      throw error;
    }
  });

  /**
   * Get user's scan history
   * GET /api/v1/ai/scan-history
   */
  getScanHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const limit = parseInt(req.query.limit as string, 10) || 30;

    const history = await aiService.getUserScanHistory(userId, limit);
    ApiResponse.success(res, history, "Lấy lịch sử quét AI thành công");
  });

  /**
   * Delete a scan history record
   * DELETE /api/v1/ai/scan-history/:id
   */
  deleteScanHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const { id } = req.params as { id: string };

    await aiService.deleteScanHistory(userId, id);
    ApiResponse.success(res, null, "Xoá lịch sử quét thành công");
  });

  /**
   * Draggable AI Assistant Chat
   * POST /api/v1/ai/assistant-chat
   */
  assistantChat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?._id ? req.user._id.toString() : "guest";
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      throw new BadRequestError("Nội dung câu hỏi (message) không được để trống");
    }

    const reply = await aiService.assistantChat(userId, message.trim(), conversationHistory);
    ApiResponse.success(res, reply, "Trợ lý AI phản hồi thành công");
  });

  /**
   * Real-time Cooking Voice Copilot
   * POST /api/v1/ai/cooking-copilot
   */
  cookingVoiceCopilot = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?._id ? req.user._id.toString() : "guest";
    const { recipeTitle, currentStep, stepTimer, recipeContext, userVoiceText, conversationHistory } = req.body;

    if (!userVoiceText || typeof userVoiceText !== "string" || !userVoiceText.trim()) {
      throw new BadRequestError("Nội dung giọng nói (userVoiceText) không được để trống");
    }

    if (!currentStep || typeof currentStep.stepNumber !== "number") {
      throw new BadRequestError("Thông tin bước nấu ăn hiện tại (currentStep) không hợp lệ");
    }

    const result = await aiService.cookingVoiceCopilot(userId, {
      recipeTitle: recipeTitle || "Món ăn",
      currentStep,
      stepTimer,
      recipeContext,
      userVoiceText: userVoiceText.trim(),
      conversationHistory,
    });

    ApiResponse.success(res, result, "Trợ lý giọng nói phản hồi thành công");
  });
}

export const aiController = new AIController();
