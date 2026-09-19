import mongoose from "mongoose";
import { cookingHistoryRepository } from "../repositories/cookingHistory.repository";
import { userRepository } from "../repositories/user.repository";
import { recipeRepository } from "../repositories/recipe.repository";
import { ICookingHistory } from "../models/CookingHistory";
import { NotFoundError, ForbiddenError } from "../utils/errors";

export interface RecordCookingInput {
  recipeId: string;
  recipeName: string;
  image?: string;
  durationMinutes: number;
  servings?: number;
  usedIngredients?: string[];
  calories?: number;
  rating?: number;
  cookedAt?: Date;
}

export interface CookingCompletionResult {
  historyItem: ICookingHistory;
  xpEarned: number;
  chefExp: number;
  level: string;
  leveledUp: boolean;
}

/**
 * Calculates chef rank tier based on cumulative experience points (XP)
 * 0 - 150: "Tập sự"
 * 151 - 400: "Bếp gia đình"
 * 401 - 800: "Đầu bếp tài ba"
 * 801+: "Bếp trưởng"
 */
export function calculateChefLevel(xp: number): string {
  if (xp >= 801) return "Bếp trưởng";
  if (xp >= 401) return "Đầu bếp tài ba";
  if (xp >= 151) return "Bếp gia đình";
  return "Tập sự";
}

export class CookingHistoryService {
  async recordCooking(
    userId: string,
    input: RecordCookingInput
  ): Promise<CookingCompletionResult> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Resolve recipe image fallback if not provided
    let finalImage = input.image;
    if (!finalImage && mongoose.Types.ObjectId.isValid(input.recipeId)) {
      const originalRecipe = await recipeRepository.findById(input.recipeId);
      if (originalRecipe && originalRecipe.image) {
        finalImage = originalRecipe.image;
      }
    }
    if (!finalImage) {
      finalImage =
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";
    }

    const xpToAward = 50;
    const oldExp = user.chefExp || 0;
    const oldLevel = user.level || "Tập sự";

    const newExp = oldExp + xpToAward;
    const newLevel = calculateChefLevel(newExp);
    const leveledUp = oldLevel !== newLevel;

    // Persist new XP and rank to User document
    user.chefExp = newExp;
    user.level = newLevel;
    await user.save();

    // Create history record
    const historyItem = await cookingHistoryRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      recipeId: new mongoose.Types.ObjectId(input.recipeId),
      recipeName: input.recipeName,
      image: finalImage,
      durationMinutes: input.durationMinutes,
      servings: input.servings || 2,
      usedIngredients: input.usedIngredients || [],
      calories: input.calories || 0,
      rating: input.rating,
      cookedAt: input.cookedAt || new Date(),
      xpEarned: xpToAward,
    });

    return {
      historyItem,
      xpEarned: xpToAward,
      chefExp: newExp,
      level: newLevel,
      leveledUp,
    };
  }

  async getCookingHistory(
    userId: string,
    limit = 20,
    page = 1
  ): Promise<{
    items: ICookingHistory[];
    total: number;
    page: number;
    totalPages: number;
    chefExp: number;
    level: string;
  }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const result = await cookingHistoryRepository.findByUserId(userId, limit, page);

    return {
      ...result,
      chefExp: user.chefExp || 0,
      level: user.level || "Tập sự",
    };
  }

  async deleteCookingHistory(
    id: string,
    userId: string,
    userRole = "user"
  ): Promise<void> {
    const item = await cookingHistoryRepository.findById(id);
    if (!item) {
      throw new NotFoundError("Cooking history record not found");
    }

    if (userRole !== "admin" && item.userId.toString() !== userId) {
      throw new ForbiddenError(
        "You are not authorized to delete this cooking history item"
      );
    }

    await cookingHistoryRepository.delete(id);
  }
}

export const cookingHistoryService = new CookingHistoryService();
export default cookingHistoryService;
