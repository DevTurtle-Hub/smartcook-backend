import { Request, Response } from "express";
import { categoryService } from "../services/category.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { cacheService } from "../config/cache";

export class CategoryController {
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const activeOnly = req.query.all !== "true";
    const categories = await categoryService.getCategories(activeOnly);
    ApiResponse.success(res, categories, "Categories fetched successfully");
  });

  getByCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code } = req.params as { code: string };
    const category = await categoryService.getCategoryByCode(code);
    ApiResponse.success(res, category, "Category fetched successfully");
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const category = await categoryService.createCategory(req.body);
    await cacheService.delByPattern("categories:*");
    ApiResponse.created(res, category, "Category created successfully");
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const category = await categoryService.updateCategory(id, req.body);
    await cacheService.delByPattern("categories:*");
    ApiResponse.success(res, category, "Category updated successfully");
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    await categoryService.deleteCategory(id);
    await cacheService.delByPattern("categories:*");
    ApiResponse.success(res, null, "Category deleted successfully");
  });
}

export const categoryController = new CategoryController();
export default categoryController;
