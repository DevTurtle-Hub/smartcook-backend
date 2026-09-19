import { fridgeRepository } from "../repositories/fridge.repository";
import { ingredientRepository } from "../repositories/ingredient.repository";
import { IUserFridge, IFridgeItem } from "../models/UserFridge";
import { NotFoundError } from "../utils/errors";

export class FridgeService {
  async getMyFridge(userId: string): Promise<IUserFridge> {
    return fridgeRepository.getOrCreateFridge(userId);
  }

  async addItem(
    userId: string,
    data: Partial<IFridgeItem>
  ): Promise<IUserFridge> {
    // If category is not provided, try to match against master ingredients
    if (!data.category && data.name) {
      const matched = await ingredientRepository.findByNameOrAlias(data.name);
      if (matched) {
        data.category = matched.category;
        data.ingredientId = matched._id as any;
        if (!data.amount) {
          data.amount = `1 ${matched.defaultUnit}`;
        }
      }
    }

    return fridgeRepository.addItem(userId, data);
  }

  async updateItem(
    userId: string,
    itemId: string,
    data: Partial<IFridgeItem>
  ): Promise<IUserFridge> {
    const updated = await fridgeRepository.updateItem(userId, itemId, data);
    if (!updated) {
      throw new NotFoundError("Fridge item not found");
    }
    return updated;
  }

  async removeItem(userId: string, itemId: string): Promise<IUserFridge> {
    const updated = await fridgeRepository.removeItem(userId, itemId);
    if (!updated) {
      throw new NotFoundError("Fridge item not found");
    }
    return updated;
  }

  async clearFridge(userId: string): Promise<IUserFridge> {
    const cleared = await fridgeRepository.clearFridge(userId);
    if (!cleared) {
      throw new NotFoundError("User fridge not found");
    }
    return cleared;
  }
}

export const fridgeService = new FridgeService();
export default fridgeService;
