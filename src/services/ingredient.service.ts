import {
  ingredientRepository,
  IngredientFilter,
} from "../repositories/ingredient.repository";
import { IIngredient, IngredientCategory } from "../models/Ingredient";
import { MASTER_INGREDIENTS } from "../data/seedIngredients";
import { NotFoundError } from "../utils/errors";

export class IngredientService {
  async getIngredients(
    filter: IngredientFilter = {},
    page = 1,
    limit = 50
  ): Promise<{ ingredients: IIngredient[]; total: number; page: number; totalPages: number }> {
    const totalCount = await ingredientRepository.count();
    if (totalCount === 0) {
      await this.seedIngredients();
    }
    return ingredientRepository.findAll(filter, page, limit);
  }

  async getByCategory(category: IngredientCategory): Promise<IIngredient[]> {
    const totalCount = await ingredientRepository.count();
    if (totalCount === 0) {
      await this.seedIngredients();
    }
    return ingredientRepository.findByCategory(category);
  }

  async getById(id: string): Promise<IIngredient> {
    const item = await ingredientRepository.findById(id);
    if (!item) {
      throw new NotFoundError("Ingredient not found");
    }
    return item;
  }

  async findByNameOrAlias(name: string): Promise<IIngredient | null> {
    return ingredientRepository.findByNameOrAlias(name);
  }

  async createIngredient(data: Partial<IIngredient>): Promise<IIngredient> {
    return ingredientRepository.create(data);
  }

  async updateIngredient(
    id: string,
    data: Partial<IIngredient>
  ): Promise<IIngredient> {
    const updated = await ingredientRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError("Ingredient not found");
    }
    return updated;
  }

  async deleteIngredient(id: string): Promise<void> {
    const deleted = await ingredientRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Ingredient not found");
    }
  }

  async seedIngredients(): Promise<void> {
    await ingredientRepository.bulkUpsert(MASTER_INGREDIENTS);
  }
}

export const ingredientService = new IngredientService();
export default ingredientService;
