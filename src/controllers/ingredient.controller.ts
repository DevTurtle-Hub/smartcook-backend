import { Request, Response } from "express";
import { ingredientService } from "../services/ingredient.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { IngredientCategory } from "../models/Ingredient";
import { cacheService } from "../config/cache";

export class IngredientController {
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const category = req.query.category as IngredientCategory | undefined;
    const search = req.query.search as string | undefined;
    const isActive =
      req.query.all === "true" ? undefined : true;

    const result = await ingredientService.getIngredients(
      { category, search, isActive },
      page,
      limit
    );
    ApiResponse.success(res, result, "Ingredients fetched successfully");
  });

  getByCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { category } = req.params;
    const ingredients = await ingredientService.getByCategory(
      category as IngredientCategory
    );
    ApiResponse.success(res, ingredients, "Ingredients by category fetched successfully");
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const ingredient = await ingredientService.getById(id);
    ApiResponse.success(res, ingredient, "Ingredient fetched successfully");
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const ingredient = await ingredientService.createIngredient(req.body);
    await cacheService.delByPattern("ingredients:*");
    ApiResponse.created(res, ingredient, "Ingredient created successfully");
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const ingredient = await ingredientService.updateIngredient(id, req.body);
    await cacheService.delByPattern("ingredients:*");
    ApiResponse.success(res, ingredient, "Ingredient updated successfully");
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    await ingredientService.deleteIngredient(id);
    await cacheService.delByPattern("ingredients:*");
    ApiResponse.success(res, null, "Ingredient deleted successfully");
  });

  seed = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    await ingredientService.seedIngredients();
    await cacheService.delByPattern("ingredients:*");
    ApiResponse.success(res, null, "Master ingredients seeded successfully");
  });
}

export const ingredientController = new IngredientController();
export default ingredientController;
