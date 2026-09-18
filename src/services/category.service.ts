import { categoryRepository } from "../repositories/category.repository";
import { ICategory } from "../models/Category";
import { ConflictError, NotFoundError } from "../utils/errors";

export const INITIAL_CATEGORIES = [
  { code: "all", name: "Tất cả", icon: "restaurant-outline", order: 0 },
  { code: "family", name: "Gia đình", icon: "people-outline", order: 1 },
  { code: "quick", name: "Nấu nhanh < 20p", icon: "flash-outline", order: 2 },
  { code: "healthy", name: "Healthy & Diet", icon: "leaf-outline", order: 3 },
  { code: "budget", name: "Tiết kiệm", icon: "wallet-outline", order: 4 },
  { code: "kids", name: "Trẻ em", icon: "happy-outline", order: 5 },
  { code: "vegetarian", name: "Ăn chay", icon: "nutrition-outline", order: 6 },
  { code: "vietnamese", name: "Món Việt", icon: "flag-outline", order: 7 },
  { code: "dessert", name: "Tráng miệng", icon: "ice-cream-outline", order: 8 },
];

export class CategoryService {
  async getCategories(activeOnly = true): Promise<ICategory[]> {
    let categories = await categoryRepository.findAll(activeOnly);
    if (categories.length === 0) {
      await this.seedCategories();
      categories = await categoryRepository.findAll(activeOnly);
    }
    return categories;
  }

  async getCategoryByCode(code: string): Promise<ICategory> {
    const category = await categoryRepository.findByCode(code);
    if (!category) {
      throw new NotFoundError(`Category with code '${code}' not found`);
    }
    return category;
  }

  async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    if (data.code) {
      const existing = await categoryRepository.findByCode(data.code);
      if (existing) {
        throw new ConflictError(`Category code '${data.code}' already exists`);
      }
    }
    return categoryRepository.create(data);
  }

  async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory> {
    const updated = await categoryRepository.update(id, data);
    if (!updated) {
      throw new NotFoundError("Category not found");
    }
    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    const deleted = await categoryRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("Category not found");
    }
  }

  async seedCategories(): Promise<void> {
    for (const item of INITIAL_CATEGORIES) {
      const existing = await categoryRepository.findByCode(item.code);
      if (!existing) {
        await categoryRepository.create(item);
      }
    }
  }
}

export const categoryService = new CategoryService();
export default categoryService;
