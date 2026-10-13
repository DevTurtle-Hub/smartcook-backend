import mongoose from "mongoose";
import { MealPlan, IMealPlan, IMealSlotItem, IPlannerDay } from "../models/MealPlan";
import { CartItem, ICartItem } from "../models/CartItem";
import { normalizeVietnamese } from "../utils/text";

const DAYS_OF_WEEK = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

export class PlannerRepository {
  /**
   * Normalize any date to the Monday (00:00:00.000 UTC) of its week.
   */
  normalizeToMonday(dateInput?: Date | string): Date {
    const d = dateInput ? new Date(dateInput) : new Date();
    // getDay: 0 is Sunday, 1 is Monday, ..., 6 is Saturday
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0));
    return monday;
  }

  /**
   * Build default 7 days with dates starting from weekStartDate
   */
  buildDefaultDays(mondayDate: Date): IPlannerDay[] {
    return DAYS_OF_WEEK.map((dayName, idx) => {
      const dayDate = new Date(mondayDate);
      dayDate.setUTCDate(mondayDate.getUTCDate() + idx);
      const dateString = dayDate.toISOString().split("T")[0]; // YYYY-MM-DD
      return {
        dayOfWeek: dayName,
        date: dateString,
        meals: [],
      };
    });
  }

  /**
   * Find MealPlan by weekStartDate for a user
   */
  async findPlanByWeek(userId: string, weekStartDate: Date): Promise<IMealPlan | null> {
    return MealPlan.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      weekStartDate,
    }).populate("days.meals.recipeId");
  }

  /**
   * Get or create a MealPlan for the given week
   */
  async getOrCreatePlan(userId: string, weekDate?: Date | string): Promise<IMealPlan> {
    const monday = this.normalizeToMonday(weekDate);
    let plan = await MealPlan.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      weekStartDate: monday,
    }).populate("days.meals.recipeId");

    if (!plan) {
      const defaultDays = this.buildDefaultDays(monday);
      plan = await MealPlan.create({
        userId: new mongoose.Types.ObjectId(userId),
        weekStartDate: monday,
        days: defaultDays,
      });
      plan = await plan.populate("days.meals.recipeId");
    }

    return plan;
  }

  /**
   * Add or update a meal slot in a specific day of the week plan
   */
  async setMealSlot(
    userId: string,
    weekStartDate: Date,
    dayOfWeek: string,
    mealData: {
      slot: "Bữa Sáng" | "Bữa Trưa" | "Bữa Tối" | "Bữa Phụ";
      time?: string;
      recipeId?: string;
      customTitle?: string;
      calories?: number;
      isCooked?: boolean;
      notes?: string;
    }
  ): Promise<IMealPlan | null> {
    const plan = await this.getOrCreatePlan(userId, weekStartDate);

    const day = plan.days.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) {
      return null;
    }

    // Check if slot already exists in this day
    const existingSlotIndex = day.meals.findIndex((m) => m.slot === mealData.slot);

    const newSlot: IMealSlotItem = {
      slot: mealData.slot,
      time: mealData.time || "12:00",
      recipeId: mealData.recipeId
        ? new mongoose.Types.ObjectId(mealData.recipeId)
        : undefined,
      customTitle: mealData.customTitle,
      calories: mealData.calories || 0,
      isCooked: mealData.isCooked || false,
      notes: mealData.notes,
    };

    if (existingSlotIndex >= 0) {
      day.meals[existingSlotIndex] = newSlot;
    } else {
      day.meals.push(newSlot);
    }

    await plan.save();
    return this.findPlanByWeek(userId, weekStartDate);
  }

  /**
   * Remove a meal slot from a specific day
   */
  async removeMealSlot(
    userId: string,
    weekStartDate: Date,
    dayOfWeek: string,
    slot: string
  ): Promise<IMealPlan | null> {
    const plan = await this.getOrCreatePlan(userId, weekStartDate);

    const day = plan.days.find((d) => d.dayOfWeek === dayOfWeek);
    if (!day) return null;

    day.meals = day.meals.filter((m) => m.slot !== slot);
    await plan.save();

    return this.findPlanByWeek(userId, weekStartDate);
  }

  // ===================== CART / SHOPPING LIST METHODS =====================

  /**
   * Get all cart items for a user
   */
  async getCartItems(userId: string): Promise<ICartItem[]> {
    return CartItem.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).sort({ createdAt: -1 });
  }

  /**
   * Find cart item by normalized name for a user
   */
  async findCartItemByName(userId: string, name: string): Promise<ICartItem | null> {
    const normalized = normalizeVietnamese(name);
    return CartItem.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      normalizedName: normalized,
    });
  }

  /**
   * Add a single cart item
   */
  async addCartItem(itemData: Partial<ICartItem>): Promise<ICartItem> {
    return CartItem.create(itemData);
  }

  /**
   * Upsert cart item (if already exists, update unbought if requested)
   */
  async upsertCartItem(
    userId: string,
    itemData: {
      name: string;
      amount: string;
      price?: number;
      category?: string;
      recipeTitle?: string;
      recipeId?: string;
      isAutoGenerated?: boolean;
    }
  ): Promise<ICartItem> {
    const normalized = normalizeVietnamese(itemData.name);
    const existing = await CartItem.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      normalizedName: normalized,
    });

    if (existing) {
      existing.amount = itemData.amount || existing.amount;
      if (itemData.price !== undefined) existing.price = itemData.price;
      if (itemData.recipeTitle) existing.recipeTitle = itemData.recipeTitle;
      if (itemData.recipeId)
        existing.recipeId = new mongoose.Types.ObjectId(itemData.recipeId);
      await existing.save();
      return existing;
    }

    return CartItem.create({
      userId: new mongoose.Types.ObjectId(userId),
      name: itemData.name,
      normalizedName: normalized,
      amount: itemData.amount || "1",
      price: itemData.price || 0,
      category: itemData.category || "Rau củ",
      recipeTitle: itemData.recipeTitle,
      recipeId: itemData.recipeId
        ? new mongoose.Types.ObjectId(itemData.recipeId)
        : undefined,
      bought: false,
      isAutoGenerated: itemData.isAutoGenerated || false,
    });
  }

  /**
   * Update bought status of a cart item
   */
  async updateBoughtStatus(
    id: string,
    userId: string,
    bought: boolean
  ): Promise<ICartItem | null> {
    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (mongoose.isValidObjectId(id)) {
      filter._id = new mongoose.Types.ObjectId(id);
    } else {
      const decoded = decodeURIComponent(id).trim();
      const normalized = normalizeVietnamese(decoded);
      filter.$or = [
        { name: decoded },
        { name: new RegExp(`^${decoded}$`, "i") },
        { normalizedName: normalized },
      ];
    }
    return CartItem.findOneAndUpdate(
      filter,
      { bought },
      { returnDocument: "after" }
    );
  }

  /**
   * Delete a cart item by ObjectId or by item name
   */
  async removeCartItem(id: string, userId: string): Promise<boolean> {
    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (mongoose.isValidObjectId(id)) {
      filter._id = new mongoose.Types.ObjectId(id);
    } else {
      const decoded = decodeURIComponent(id).trim();
      const normalized = normalizeVietnamese(decoded);
      filter.$or = [
        { name: decoded },
        { name: new RegExp(`^${decoded}$`, "i") },
        { normalizedName: normalized },
      ];
    }
    const res = await CartItem.deleteOne(filter);
    return (res.deletedCount || 0) > 0;
  }

  /**
   * Clear all bought items
   */
  async clearBoughtItems(userId: string): Promise<number> {
    const res = await CartItem.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      bought: true,
    });
    return res.deletedCount || 0;
  }

  /**
   * Clear all cart items for a user (unconditionally)
   */
  async clearAllCartItems(userId: string): Promise<number> {
    const res = await CartItem.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
    });
    return res.deletedCount || 0;
  }

  /**
   * Get all bought items ready for sync
   */
  async getBoughtItems(userId: string): Promise<ICartItem[]> {
    return CartItem.find({
      userId: new mongoose.Types.ObjectId(userId),
      bought: true,
      syncedToFridge: false,
    });
  }

  /**
   * Mark items as synced
   */
  async markItemsSynced(itemIds: mongoose.Types.ObjectId[]): Promise<void> {
    await CartItem.updateMany(
      { _id: { $in: itemIds } },
      { syncedToFridge: true }
    );
  }
}

export const plannerRepository = new PlannerRepository();
