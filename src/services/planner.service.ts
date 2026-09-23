import mongoose from "mongoose";
import { plannerRepository } from "../repositories/planner.repository";
import { recipeRepository } from "../repositories/recipe.repository";
import { fridgeRepository } from "../repositories/fridge.repository";
import { ingredientRepository } from "../repositories/ingredient.repository";
import { normalizeVietnamese } from "../utils/text";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { IMealPlan } from "../models/MealPlan";
import { ICartItem } from "../models/CartItem";
import { IngredientCategory } from "../models/Ingredient";

export interface SmartShoppingResult {
  weekStartDate: string;
  items: ICartItem[];
  estimatedTotalCost: number;
  totalItemsCount: number;
  unboughtCount: number;
  boughtCount: number;
  fridgeItemsExcludedCount: number;
}

export interface SyncToFridgeResult {
  syncedCount: number;
  syncedItems: {
    name: string;
    amount: string;
    category: string;
  }[];
  totalFridgeItems: number;
}

export class PlannerService {
  /**
   * Get weekly meal plan for current or specified week
   */
  async getWeeklyPlan(userId: string, weekDate?: string): Promise<any> {
    const monday = plannerRepository.normalizeToMonday(weekDate);
    const plan = await plannerRepository.getOrCreatePlan(userId, monday);

    // Compute daily calories summary
    const daysWithSummary = plan.days.map((d) => {
      const dailyCalories = d.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
      const mealsCount = d.meals.length;
      return {
        dayOfWeek: d.dayOfWeek,
        date: d.date,
        dailyCalories,
        mealsCount,
        meals: d.meals.map((m) => {
          const mObj = (m as any).toObject ? (m as any).toObject() : m;
          const recipe = mObj.recipeId;
          return {
            _id: mObj._id,
            slot: mObj.slot,
            time: mObj.time,
            calories: mObj.calories,
            isCooked: mObj.isCooked,
            notes: mObj.notes,
            customTitle: mObj.customTitle,
            recipe: recipe
              ? {
                  _id: recipe._id,
                  id: recipe._id,
                  title: recipe.title,
                  image: recipe.image,
                  minutes: recipe.minutes,
                  difficulty: recipe.difficulty,
                  calories: recipe.calories,
                  rating: recipe.rating,
                }
              : null,
          };
        }),
      };
    });

    const totalWeekCalories = daysWithSummary.reduce(
      (sum, d) => sum + d.dailyCalories,
      0
    );

    return {
      _id: plan._id,
      weekStartDate: plan.weekStartDate.toISOString().split("T")[0],
      totalWeekCalories,
      days: daysWithSummary,
    };
  }

  /**
   * Set or update a meal slot in a day
   */
  async setMealSlot(
    userId: string,
    data: {
      weekDate?: string;
      dayOfWeek: string;
      slot: "Bữa Sáng" | "Bữa Trưa" | "Bữa Tối" | "Bữa Phụ";
      time?: string;
      recipeId?: string;
      customTitle?: string;
      calories?: number;
      isCooked?: boolean;
      notes?: string;
    }
  ): Promise<any> {
    const monday = plannerRepository.normalizeToMonday(data.weekDate);

    let calories = data.calories || 0;
    let title = data.customTitle;

    // If recipeId is provided, fetch recipe info
    if (data.recipeId) {
      const recipe = await recipeRepository.findById(data.recipeId);
      if (!recipe) {
        throw new NotFoundError("Công thức món ăn không tồn tại");
      }
      if (!calories) {
        calories = recipe.calories || 400;
      }
      if (!title) {
        title = recipe.title;
      }
    }

    const updated = await plannerRepository.setMealSlot(userId, monday, data.dayOfWeek, {
      slot: data.slot,
      time: data.time || (data.slot === "Bữa Sáng" ? "07:00" : data.slot === "Bữa Trưa" ? "12:00" : "19:00"),
      recipeId: data.recipeId,
      customTitle: title,
      calories,
      isCooked: data.isCooked || false,
      notes: data.notes,
    });

    if (!updated) {
      throw new BadRequestError("Ngày trong tuần không hợp lệ (Thứ 2 - CN)");
    }

    return this.getWeeklyPlan(userId, monday.toISOString());
  }

  /**
   * Remove a meal slot
   */
  async removeMealSlot(
    userId: string,
    dayOfWeek: string,
    slot: string,
    weekDate?: string
  ): Promise<any> {
    const monday = plannerRepository.normalizeToMonday(weekDate);
    const updated = await plannerRepository.removeMealSlot(
      userId,
      monday,
      dayOfWeek,
      slot
    );

    if (!updated) {
      throw new BadRequestError("Không thể xoá bữa ăn");
    }

    return this.getWeeklyPlan(userId, monday.toISOString());
  }

  // ===================== SMART SHOPPING LIST & FRIDGE EXCLUSION =====================

  /**
   * Auto-generate smart shopping list from weekly plan, subtracting in-fridge items.
   * Formula: ShoppingList = TotalWeeklyPlanIngredients - InFridgeIngredients
   */
  async getSmartShoppingList(
    userId: string,
    weekDate?: string
  ): Promise<SmartShoppingResult> {
    const monday = plannerRepository.normalizeToMonday(weekDate);
    const plan = await plannerRepository.getOrCreatePlan(userId, monday);

    // 1. Collect all recipes from the weekly plan (handle both populated object and raw ObjectId)
    const recipeList: any[] = [];
    const recipeIdsToFetch: string[] = [];

    plan.days.forEach((day) => {
      day.meals.forEach((m) => {
        if (m.recipeId) {
          const rObj = (m.recipeId as any).toObject ? (m.recipeId as any).toObject() : m.recipeId;
          if (rObj.ingredients && Array.isArray(rObj.ingredients)) {
            recipeList.push(rObj);
          } else {
            const rawId = rObj._id ? rObj._id.toString() : rObj.toString();
            recipeIdsToFetch.push(rawId);
          }
        }
      });
    });

    if (recipeIdsToFetch.length > 0) {
      const fetched = await Promise.all(
        Array.from(new Set(recipeIdsToFetch)).map((id) => recipeRepository.findById(id))
      );
      recipeList.push(...fetched.filter(Boolean));
    }

    const recipes = recipeList;

    // 3. Aggregate required ingredients across all planned meals
    interface NeededIngredient {
      name: string;
      normalizedName: string;
      amount: string;
      category: string;
      recipeTitle: string;
      recipeId?: string;
      price: number;
    }

    const neededIngredientsMap = new Map<string, NeededIngredient>();

    recipes.filter(Boolean).forEach((recipe: any) => {
      if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) return;

      recipe.ingredients.forEach((ing: any) => {
        const rawName = ing.name || "";
        if (!rawName.trim()) return;

        const normalized = normalizeVietnamese(rawName);
        const existing = neededIngredientsMap.get(normalized);

        // Approximate category and price
        const cat = this.inferCategory(rawName);
        const price = this.inferEstimatedPrice(rawName, ing.amount);

        if (!existing) {
          neededIngredientsMap.set(normalized, {
            name: rawName,
            normalizedName: normalized,
            amount: ing.amount || "1",
            category: cat,
            recipeTitle: recipe.title,
            recipeId: recipe._id.toString(),
            price,
          });
        }
      });
    });

    // 4. Fetch user's fridge items to subtract
    const fridge = await fridgeRepository.getOrCreateFridge(userId);
    const fridgeNormalizedNames = fridge.items.map((it) => it.normalizedName);

    let fridgeItemsExcludedCount = 0;

    // 5. Filter out ingredients already in the fridge
    const ingredientsToBuy: NeededIngredient[] = [];

    neededIngredientsMap.forEach((ing) => {
      const isAlreadyInFridge = fridgeNormalizedNames.some(
        (fName) =>
          fName.includes(ing.normalizedName) ||
          ing.normalizedName.includes(fName) ||
          ing.normalizedName.split(" ").some((w) => w.length > 2 && fName.includes(w))
      );

      if (isAlreadyInFridge) {
        fridgeItemsExcludedCount++;
      } else {
        ingredientsToBuy.push(ing);
      }
    });

    // 6. Sync into CartItem collection (Auto-upsert needed items)
    for (const item of ingredientsToBuy) {
      await plannerRepository.upsertCartItem(userId, {
        name: item.name,
        amount: item.amount,
        price: item.price,
        category: item.category,
        recipeTitle: item.recipeTitle,
        recipeId: item.recipeId,
        isAutoGenerated: true,
      });
    }

    // 7. Get final cart items for this user
    const allCartItems = await plannerRepository.getCartItems(userId);

    const estimatedTotalCost = allCartItems.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );
    const unboughtCount = allCartItems.filter((i) => !i.bought).length;
    const boughtCount = allCartItems.filter((i) => i.bought).length;

    return {
      weekStartDate: monday.toISOString().split("T")[0],
      items: allCartItems,
      estimatedTotalCost,
      totalItemsCount: allCartItems.length,
      unboughtCount,
      boughtCount,
      fridgeItemsExcludedCount,
    };
  }

  /**
   * Add a manual item to shopping cart
   */
  async addCartItem(
    userId: string,
    data: {
      name: string;
      amount?: string;
      price?: number;
      category?: string;
      recipeTitle?: string;
    }
  ): Promise<ICartItem> {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestError("Tên nguyên liệu không được để trống");
    }

    const normalized = normalizeVietnamese(data.name);
    const category = data.category || this.inferCategory(data.name);
    const price = data.price !== undefined ? data.price : this.inferEstimatedPrice(data.name, data.amount);

    return plannerRepository.addCartItem({
      userId: new mongoose.Types.ObjectId(userId) as any,
      name: data.name.trim(),
      normalizedName: normalized,
      amount: data.amount || "1",
      price,
      category,
      recipeTitle: data.recipeTitle,
      bought: false,
      isAutoGenerated: false,
    });
  }

  /**
   * Toggle or update bought status
   */
  async updateBoughtStatus(
    id: string,
    userId: string,
    bought: boolean
  ): Promise<ICartItem> {
    const item = await plannerRepository.updateBoughtStatus(id, userId, bought);
    if (!item) {
      throw new NotFoundError("Mục đi chợ không tồn tại");
    }
    return item;
  }

  /**
   * Remove a single cart item
   */
  async removeCartItem(id: string, userId: string): Promise<boolean> {
    const deleted = await plannerRepository.removeCartItem(id, userId);
    if (!deleted) {
      throw new NotFoundError("Mục đi chợ không tồn tại");
    }
    return true;
  }

  /**
   * Clear all bought items
   */
  async clearBoughtItems(userId: string): Promise<{ deletedCount: number }> {
    const count = await plannerRepository.clearBoughtItems(userId);
    return { deletedCount: count };
  }

  /**
   * 1-Click Sync bought items into User's Fridge
   */
  async syncBoughtToFridge(userId: string): Promise<SyncToFridgeResult> {
    const boughtItems = await plannerRepository.getBoughtItems(userId);

    if (boughtItems.length === 0) {
      const fridge = await fridgeRepository.getOrCreateFridge(userId);
      return {
        syncedCount: 0,
        syncedItems: [],
        totalFridgeItems: fridge.items.length,
      };
    }

    // Convert bought cart items into fridge items
    const syncedItemsData: { name: string; amount: string; category: string }[] = [];
    const itemIdsToMark: mongoose.Types.ObjectId[] = [];

    for (const item of boughtItems) {
      const categoryEnum = this.mapToFridgeCategory(item.category, item.name);
      
      // Default expiry date: 7 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      await fridgeRepository.addItem(userId, {
        name: item.name,
        normalizedName: item.normalizedName,
        amount: item.amount || "1",
        category: categoryEnum,
        storageLocation: categoryEnum === "meat" || categoryEnum === "seafood" ? "frozen" : "chilled",
        expiryDate,
        note: `Tự động nạp từ Giỏ Đi Chợ (${item.recipeTitle || "Kế hoạch tuần"})`,
        addedAt: new Date(),
      });

      syncedItemsData.push({
        name: item.name,
        amount: item.amount,
        category: categoryEnum,
      });

      itemIdsToMark.push(item._id as mongoose.Types.ObjectId);
    }

    // Mark cart items as synced
    await plannerRepository.markItemsSynced(itemIdsToMark);

    const updatedFridge = await fridgeRepository.getOrCreateFridge(userId);

    return {
      syncedCount: syncedItemsData.length,
      syncedItems: syncedItemsData,
      totalFridgeItems: updatedFridge.items.length,
    };
  }

  // ===================== HELPER METHODS =====================

  /**
   * Infer ingredient category from name
   */
  private inferCategory(name: string): string {
    const lower = name.toLowerCase();
    if (
      lower.includes("thịt") ||
      lower.includes("bò") ||
      lower.includes("gà") ||
      lower.includes("heo") ||
      lower.includes("cá") ||
      lower.includes("tôm") ||
      lower.includes("mực")
    ) {
      return "Thịt & Cá";
    }
    if (
      lower.includes("rau") ||
      lower.includes("cà chua") ||
      lower.includes("hành") ||
      lower.includes("ớt") ||
      lower.includes("cải") ||
      lower.includes("măng") ||
      lower.includes("nấm") ||
      lower.includes("khoai") ||
      lower.includes("cà rốt")
    ) {
      return "Rau củ";
    }
    if (
      lower.includes("bơ") ||
      lower.includes("phô mai") ||
      lower.includes("sữa") ||
      lower.includes("dầu") ||
      lower.includes("tiêu") ||
      lower.includes("nước mắm") ||
      lower.includes("sốt") ||
      lower.includes("muối") ||
      lower.includes("đường")
    ) {
      return "Bơ & Gia vị";
    }
    return "Khác";
  }

  /**
   * Map display category to UserFridge IngredientCategory enum
   */
  private mapToFridgeCategory(displayCategory: string, name: string): IngredientCategory {
    const lower = (displayCategory + " " + name).toLowerCase();
    if (lower.includes("bò") || lower.includes("heo") || lower.includes("thịt gà") || lower.includes("thịt")) {
      return "meat";
    }
    if (lower.includes("cá") || lower.includes("tôm") || lower.includes("mực") || lower.includes("hải sản")) {
      return "seafood";
    }
    if (lower.includes("rau") || lower.includes("cải") || lower.includes("xà lách")) {
      return "greens";
    }
    if (lower.includes("củ") || lower.includes("cà chua") || lower.includes("măng") || lower.includes("nấm")) {
      return "veggies";
    }
    if (lower.includes("trứng") || lower.includes("đậu hũ") || lower.includes("tofu")) {
      return "egg_tofu";
    }
    if (lower.includes("sữa") || lower.includes("bơ") || lower.includes("phô mai")) {
      return "dairy";
    }
    if (lower.includes("gạo") || lower.includes("mì") || lower.includes("bún") || lower.includes("khoai")) {
      return "carbs";
    }
    return "veggies";
  }

  /**
   * Infer rough market price in VND for Vietnamese ingredients
   */
  private inferEstimatedPrice(name: string, amount?: string): number {
    const lower = name.toLowerCase();
    if (lower.includes("bò") || lower.includes("cá hồi")) return 85000;
    if (lower.includes("gà") || lower.includes("tôm") || lower.includes("thịt heo")) return 45000;
    if (lower.includes("phô mai") || lower.includes("bơ lạt")) return 35000;
    if (lower.includes("măng tây") || lower.includes("nấm đông cô")) return 25000;
    if (lower.includes("cà chua") || lower.includes("rau") || lower.includes("cải")) return 15000;
    if (lower.includes("trứng")) return 22000;
    return 20000;
  }
}

export const plannerService = new PlannerService();
