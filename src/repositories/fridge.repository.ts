import mongoose from "mongoose";
import UserFridge, { IUserFridge, IFridgeItem } from "../models/UserFridge";
import { normalizeVietnamese } from "../utils/text";

export class FridgeRepository {
  async getOrCreateFridge(userId: string): Promise<IUserFridge> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    try {
      const fridge = await UserFridge.findOneAndUpdate(
        { userId: userObjectId },
        { $setOnInsert: { userId: userObjectId, items: [] } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      ).exec();
      return fridge!;
    } catch (err: any) {
      if (err.code === 11000) {
        const existing = await UserFridge.findOne({ userId: userObjectId }).exec();
        if (existing) return existing;
      }
      throw err;
    }
  }

  async addItem(userId: string, item: Partial<IFridgeItem>): Promise<IUserFridge> {
    const fridge = await this.getOrCreateFridge(userId);
    const normalizedName = normalizeVietnamese(item.name || "");
    const newItem = {
      ...item,
      normalizedName,
      addedAt: new Date(),
    } as IFridgeItem;

    fridge.items.push(newItem);
    return fridge.save();
  }

  async updateItem(
    userId: string,
    itemId: string,
    data: Partial<IFridgeItem>
  ): Promise<IUserFridge | null> {
    const fridge = await this.getOrCreateFridge(userId);
    const itemIndex = fridge.items.findIndex(
      (it) => it._id?.toString() === itemId
    );
    if (itemIndex === -1) return null;

    if (data.name) {
      data.normalizedName = normalizeVietnamese(data.name);
    }

    Object.assign(fridge.items[itemIndex], data);
    return fridge.save();
  }

  async removeItem(userId: string, itemId: string): Promise<IUserFridge | null> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    if (!mongoose.Types.ObjectId.isValid(itemId)) return null;
    const itemObjectId = new mongoose.Types.ObjectId(itemId);

    return UserFridge.findOneAndUpdate(
      { userId: userObjectId },
      { $pull: { items: { _id: itemObjectId } } },
      { returnDocument: "after" }
    ).exec();
  }

  async clearFridge(userId: string): Promise<IUserFridge | null> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return UserFridge.findOneAndUpdate(
      { userId: userObjectId },
      { $set: { items: [] } },
      { returnDocument: "after" }
    ).exec();
  }
}

export const fridgeRepository = new FridgeRepository();
export default fridgeRepository;
