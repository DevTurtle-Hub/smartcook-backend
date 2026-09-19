import { Request, Response, NextFunction } from "express";
import { uploadToCloudinary } from "../config/cloudinary";
import { asyncHandler } from "../utils/asyncHandler";

export const processRecipeFormData = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // 1. Nếu có file upload từ Multer, tải trực tiếp lên Cloudinary
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "smartcook/recipes"
      );
      req.body.image = uploadResult.url;
    }

    // 2. Parse JSON các trường phức tạp nếu gửi từ FormData
    const jsonFields = ["ingredients", "steps", "nutrition", "tags"];
    for (const field of jsonFields) {
      if (typeof req.body[field] === "string") {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch {
          // Bỏ qua nếu chuỗi không phải JSON
        }
      }
    }

    // 3. Chuẩn hóa trường số nếu gửi từ FormData
    if (req.body.cookingTimeMinutes && !req.body.minutes) {
      req.body.minutes = Number(req.body.cookingTimeMinutes);
    } else if (req.body.minutes !== undefined) {
      req.body.minutes = Number(req.body.minutes);
    }

    if (req.body.calories !== undefined) {
      req.body.calories = Number(req.body.calories);
    }

    if (req.body.servingsCount !== undefined) {
      req.body.servingsCount = Number(req.body.servingsCount);
    }

    if (req.body.category && !req.body.categoryCode) {
      req.body.categoryCode = req.body.category;
    }

    // 4. Chuẩn hóa format ingredients & steps nếu từ Web Client
    if (Array.isArray(req.body.ingredients)) {
      req.body.ingredients = req.body.ingredients.map((ing: any) => ({
        ...ing,
        amount:
          typeof ing.amount === "number"
            ? `${ing.amount}${ing.unit ? " " + ing.unit : ""}`
            : String(ing.amount || "1 phần"),
      }));
    }

    if (Array.isArray(req.body.steps)) {
      req.body.steps = req.body.steps.map((step: any, idx: number) => ({
        ...step,
        stepNumber: step.stepNumber || idx + 1,
        title: step.title || `Bước ${step.stepNumber || idx + 1}`,
        description: step.description || step.instruction || "Chế biến theo công thức",
      }));
    }

    next();
  }
);
