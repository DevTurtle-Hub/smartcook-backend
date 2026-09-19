import CookingHistory, { ICookingHistory } from "../models/CookingHistory";

export class CookingHistoryRepository {
  async findByUserId(
    userId: string,
    limit = 50,
    page = 1
  ): Promise<{ items: ICookingHistory[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      CookingHistory.find({ userId })
        .sort({ cookedAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      CookingHistory.countDocuments({ userId }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findById(id: string): Promise<ICookingHistory | null> {
    return CookingHistory.findById(id).exec();
  }

  async create(data: Partial<ICookingHistory>): Promise<ICookingHistory> {
    const history = new CookingHistory(data);
    return history.save();
  }

  async delete(id: string): Promise<boolean> {
    const result = await CookingHistory.findByIdAndDelete(id).exec();
    return !!result;
  }

  async countByUserId(userId: string): Promise<number> {
    return CookingHistory.countDocuments({ userId });
  }
}

export const cookingHistoryRepository = new CookingHistoryRepository();
export default cookingHistoryRepository;
