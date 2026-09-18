import Ingredient, {
  IIngredient,
  IngredientCategory,
} from "../models/Ingredient";
import { normalizeVietnamese } from "../utils/text";

export interface IngredientFilter {
  category?: IngredientCategory;
  search?: string;
  isActive?: boolean;
}

export class IngredientRepository {
  async findAll(
    filter: IngredientFilter = {},
    page = 1,
    limit = 50
  ): Promise<{ ingredients: IIngredient[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, any> = {};

    if (filter.category) {
      query.category = filter.category;
    }

    if (filter.isActive !== undefined) {
      query.isActive = filter.isActive;
    } else {
      query.isActive = true;
    }

    if (filter.search) {
      const normalizedSearch = normalizeVietnamese(filter.search);
      query.$or = [
        { name: { $regex: filter.search, $options: "i" } },
        { normalizedName: { $regex: normalizedSearch, $options: "i" } },
        { aliases: { $in: [new RegExp(normalizedSearch, "i")] } },
      ];
    }

    const skip = (page - 1) * limit;
    const [ingredients, total] = await Promise.all([
      Ingredient.find(query).sort({ category: 1, name: 1 }).skip(skip).limit(limit).exec(),
      Ingredient.countDocuments(query).exec(),
    ]);

    return {
      ingredients,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findByCategory(category: IngredientCategory): Promise<IIngredient[]> {
    return Ingredient.find({ category, isActive: true }).sort({ name: 1 }).exec();
  }

  async findById(id: string): Promise<IIngredient | null> {
    return Ingredient.findById(id).exec();
  }

  async findByNameOrAlias(name: string): Promise<IIngredient | null> {
    const normalized = normalizeVietnamese(name);
    return Ingredient.findOne({
      $or: [
        { normalizedName: normalized },
        { aliases: normalized },
        { name: { $regex: `^${name}$`, $options: "i" } },
      ],
      isActive: true,
    }).exec();
  }

  async create(data: Partial<IIngredient>): Promise<IIngredient> {
    const ingredient = new Ingredient(data);
    return ingredient.save();
  }

  async update(id: string, data: Partial<IIngredient>): Promise<IIngredient | null> {
    if (data.name) {
      data.normalizedName = normalizeVietnamese(data.name);
    }
    if (data.aliases && Array.isArray(data.aliases)) {
      data.aliases = data.aliases.map((a) => normalizeVietnamese(a));
    }
    return Ingredient.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    }).exec();
  }

  async delete(id: string): Promise<IIngredient | null> {
    return Ingredient.findByIdAndDelete(id).exec();
  }

  async count(): Promise<number> {
    return Ingredient.countDocuments().exec();
  }

  async bulkUpsert(items: Partial<IIngredient>[]): Promise<void> {
    const ops = items.map((item) => {
      const normalizedName = normalizeVietnamese(item.name || "");
      return {
        updateOne: {
          filter: { normalizedName },
          update: {
            $set: {
              ...item,
              normalizedName,
              aliases: (item.aliases || []).map((a) => normalizeVietnamese(a)),
            },
          },
          upsert: true,
        },
      };
    });
    if (ops.length > 0) {
      await Ingredient.bulkWrite(ops);
    }
  }
}

export const ingredientRepository = new IngredientRepository();
export default ingredientRepository;
