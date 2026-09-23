import mongoose from "mongoose";
import Recipe, { IRecipe, RecipeDifficulty } from "../models/Recipe";
import { normalizeVietnamese } from "../utils/text";

export interface RecipeFilter {
  categoryCode?: string;
  difficulty?: RecipeDifficulty;
  maxMinutes?: number;
  tag?: string;
  search?: string;
  isActive?: boolean;
}

export class RecipeRepository {
  async findAll(
    filter: RecipeFilter = {},
    page = 1,
    limit = 10,
    sortField = "rating",
    sortOrder: "asc" | "desc" = "desc"
  ): Promise<{ recipes: IRecipe[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, any> = {};

    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    } else {
      query.isActive = true;
    }

    if (filter.categoryCode && filter.categoryCode !== "all") {
      query.categoryCode = filter.categoryCode.toLowerCase().trim();
    }

    if (filter.difficulty) {
      query.difficulty = filter.difficulty;
    }

    if (filter.maxMinutes) {
      query.minutes = { $lte: filter.maxMinutes };
    }

    if (filter.tag) {
      query.tags = { $in: [filter.tag] };
    }

    if (filter.search) {
      const normalizedSearch = normalizeVietnamese(filter.search);
      query.$or = [
        { title: { $regex: filter.search, $options: "i" } },
        { description: { $regex: filter.search, $options: "i" } },
        { "ingredients.name": { $regex: filter.search, $options: "i" } },
        { tags: { $in: [new RegExp(filter.search, "i"), new RegExp(normalizedSearch, "i")] } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortObj: Record<string, any> = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [recipes, total] = await Promise.all([
      Recipe.find(query).sort(sortObj).skip(skip).limit(limit).exec(),
      Recipe.countDocuments(query).exec(),
    ]);

    return {
      recipes,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<IRecipe | null> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Recipe.findById(id).exec();
  }

  async findByTitle(title: string): Promise<IRecipe | null> {
    return Recipe.findOne({ title: { $regex: new RegExp(`^${title.trim()}$`, "i") } }).exec();
  }

  async getAllActive(): Promise<IRecipe[]> {
    return Recipe.find({ isActive: true }).exec();
  }

  async create(data: Partial<IRecipe>): Promise<IRecipe> {
    const recipe = new Recipe(data);
    return recipe.save();
  }

  async update(id: string, data: Partial<IRecipe>): Promise<IRecipe | null> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Recipe.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    }).exec();
  }

  async delete(id: string): Promise<IRecipe | null> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return Recipe.findByIdAndDelete(id).exec();
  }

  async count(): Promise<number> {
    return Recipe.countDocuments().exec();
  }

  async bulkUpsert(recipes: Partial<IRecipe>[]): Promise<void> {
    const ops = recipes.map((recipe) => ({
      updateOne: {
        filter: { title: recipe.title },
        update: { $set: recipe },
        upsert: true,
      },
    }));
    if (ops.length > 0) {
      await Recipe.bulkWrite(ops);
    }
  }
}

export const recipeRepository = new RecipeRepository();
export default recipeRepository;
