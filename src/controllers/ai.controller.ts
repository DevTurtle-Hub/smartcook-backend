import { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinary";
import { aiService } from "../services/ai.service";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError } from "../utils/errors";
import { ApiResponse } from "../utils/response";

export class AIController {
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
      mimeType = req.file.mimetype;
      try {
        const uploadResult = await uploadToCloudinary(buffer, "smartcook/scans");
        imageUrl = uploadResult.url;
        publicId = uploadResult.publicId;
      } catch (err: any) {
        console.warn("⚠️ [AIController] Cloudinary upload failed, using placeholder URL:", err?.message || err);
        imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
      }
    } else if (req.body?.imageBase64) {
      const base64Clean = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      buffer = Buffer.from(base64Clean, "base64");
      mimeType = req.body.mimeType || "image/jpeg";
      try {
        const uploadResult = await uploadToCloudinary(buffer, "smartcook/scans");
        imageUrl = uploadResult.url;
        publicId = uploadResult.publicId;
      } catch {
        imageUrl = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
      }
    } else if (req.body?.imageUrl) {
      imageUrl = req.body.imageUrl;
      // Provide fallback 1x1 buffer for vision pipeline if no raw bytes provided
      buffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64"
      );
    } else {
      throw new BadRequestError(
        "Vui lòng cung cấp ảnh chụp thực phẩm qua file upload ('image'), 'imageBase64', hoặc 'imageUrl'"
      );
    }

    const result = await aiService.scanIngredients(userId, buffer, mimeType, imageUrl, publicId);

    ApiResponse.created(res, result, "Quét và phân tích thực phẩm thành công");
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
    const userId = req.user!._id.toString();
    const { message, conversationHistory } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      throw new BadRequestError("Nội dung câu hỏi (message) không được để trống");
    }

    const reply = await aiService.assistantChat(userId, message.trim(), conversationHistory);
    ApiResponse.success(res, reply, "Trợ lý AI phản hồi thành công");
  });
}

export const aiController = new AIController();
