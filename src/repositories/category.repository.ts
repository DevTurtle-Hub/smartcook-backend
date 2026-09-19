import Category, { ICategory } from "../models/Category";

export class CategoryRepository {
  async findAll(activeOnly = true): Promise<ICategory[]> {
    const query = activeOnly ? { isActive: true } : {};
    return Category.find(query).sort({ order: 1, createdAt: 1 }).exec();
  }

  async findByCode(code: string): Promise<ICategory | null> {
    return Category.findOne({ code: code.toLowerCase().trim() }).exec();
  }

  async findById(id: string): Promise<ICategory | null> {
    return Category.findById(id).exec();
  }

  async create(data: Partial<ICategory>): Promise<ICategory> {
    const category = new Category(data);
    return category.save();
  }

  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    }).exec();
  }

  async delete(id: string): Promise<ICategory | null> {
    return Category.findByIdAndDelete(id).exec();
  }

  async count(): Promise<number> {
    return Category.countDocuments().exec();
  }
}

export const categoryRepository = new CategoryRepository();
export default categoryRepository;
