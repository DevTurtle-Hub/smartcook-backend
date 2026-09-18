import { Request, Response } from "express";
import { recipeService } from "../services/recipe.service";
import { ApiResponse } from "../utils/response";
import { asyncHandler } from "../utils/asyncHandler";
import { RecipeDifficulty } from "../models/Recipe";

export class RecipeController {
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const categoryCode = req.query.category as string | undefined;
    const difficulty = req.query.difficulty as RecipeDifficulty | undefined;
    const maxMinutes = req.query.maxMinutes
      ? parseInt(req.query.maxMinutes as string, 10)
      : undefined;
    const tag = req.query.tag as string | undefined;
    const search = req.query.search as string | undefined;
    const sortField = (req.query.sortField as string) || "rating";
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";
    const userId = req.user?._id.toString();

    const result = await recipeService.getRecipes(
      { categoryCode, difficulty, maxMinutes, tag, search },
      page,
      limit,
      sortField,
      sortOrder,
      userId
    );
    ApiResponse.success(res, result, "Recipes fetched successfully");
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const userId = req.user?._id.toString();
    const recipe = await recipeService.getRecipeById(id, userId);
    ApiResponse.success(res, recipe, "Recipe details fetched successfully");
  });

  getFridgeMatch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const recipes = await recipeService.getFridgeMatchedRecipes(userId, limit);
    ApiResponse.success(res, recipes, "Fridge matched recipes ranked successfully");
  });

  toggleFavorite = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const { id } = req.params as { id: string };
    const result = await recipeService.toggleFavorite(userId, id);
    ApiResponse.success(
      res,
      result,
      result.isFavorite
        ? "Recipe added to favorites"
        : "Recipe removed from favorites"
    );
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const recipeData = {
      ...req.body,
      authorId: req.user?._id,
    };
    const recipe = await recipeService.createRecipe(recipeData);
    ApiResponse.created(res, recipe, "Recipe created successfully");
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const recipe = await recipeService.updateRecipe(id, req.body);
    ApiResponse.success(res, recipe, "Recipe updated successfully");
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    await recipeService.deleteRecipe(id);
    ApiResponse.success(res, null, "Recipe deleted successfully");
  });
}

export const recipeController = new RecipeController();
export default recipeController;
