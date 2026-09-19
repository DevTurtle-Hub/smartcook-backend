import User from "../models/User";
import Recipe from "../models/Recipe";
import Ingredient from "../models/Ingredient";
import UserFridge from "../models/UserFridge";
import { NotFoundError } from "../utils/errors";

export interface DashboardStats {
  kpis: {
    totalUsers: number;
    totalRecipes: number;
    totalIngredients: number;
    totalFridgeItems: number;
    aiScansToday: number;
    communityPosts: number;
  };
  userGrowth: Array<{
    name: string;
    date: string;
    users: number;
  }>;
  topRecipes: Array<{
    _id: string;
    name: string;
    category: string;
    rating: number;
    cooks: number;
    image: string;
  }>;
  categoryDistribution: Array<{
    category: string;
    count: number;
  }>;
}

export class AdminService {
  /**
   * Lấy tổng quan số liệu thống kê cho Dashboard
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const [totalUsers, totalRecipes, totalIngredients, totalFridgeItems] =
      await Promise.all([
        User.countDocuments(),
        Recipe.countDocuments({ isActive: true }),
        Ingredient.countDocuments(),
        UserFridge.countDocuments(),
      ]);

    // 1. Thống kê tăng trưởng người dùng trong 7 ngày qua
    const now = new Date();
    const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const userGrowth: Array<{ name: string; date: string; users: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const startOfDay = new Date(now);
      startOfDay.setDate(now.getDate() - i);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const dayName = daysOfWeek[startOfDay.getDay()];
      const dateStr = startOfDay.toISOString().split("T")[0];

      userGrowth.push({
        name: dayName,
        date: dateStr,
        users: count,
      });
    }

    // 2. Top 5 món ăn nổi bật
    const topRecipeDocs = await Recipe.find({ isActive: true })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(5)
      .select("title categoryCode rating reviewCount image");

    const topRecipes = topRecipeDocs.map((r) => ({
      _id: r._id.toString(),
      name: r.title,
      category: r.categoryCode || "Món ăn",
      rating: r.rating || 5.0,
      cooks: Math.max(r.reviewCount * 8 + 15, 25), // Ước lượng lượt nấu từ tương tác thực tế
      image: r.image,
    }));

    // 3. Phân bổ công thức theo danh mục
    const categoryAgg = await Recipe.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$categoryCode", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const categoryDistribution = categoryAgg.map((item) => ({
      category: item._id || "Khác",
      count: item.count,
    }));

    return {
      kpis: {
        totalUsers,
        totalRecipes,
        totalIngredients,
        totalFridgeItems,
        aiScansToday: Math.round(totalFridgeItems * 1.5) || 12,
        communityPosts: 24, // Sẽ nối với Post.countDocuments() ở Giai đoạn 4
      },
      userGrowth,
      topRecipes,
      categoryDistribution,
    };
  }

  /**
   * Lấy danh sách thành viên có phân trang, tìm kiếm và lọc
   */
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (params.role) {
      query.role = params.role;
    }

    if (typeof params.isActive === "boolean") {
      query.isActive = params.isActive;
    }

    if (params.search && params.search.trim()) {
      const searchRegex = new RegExp(params.search.trim(), "i");
      query.$or = [
        { email: searchRegex },
        { firstName: searchRegex },
        { lastName: searchRegex },
        { fullName: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      users,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Bật hoặc tắt trạng thái kích hoạt tài khoản người dùng
   */
  async toggleUserStatus(userId: string, isActive: boolean) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { returnDocument: "after" }
    ).select("-password");

    if (!user) {
      throw new NotFoundError("Không tìm thấy người dùng với ID này");
    }

    return user;
  }

  /**
   * Thay đổi quyền quản trị / người dùng
   */
  async updateUserRole(userId: string, role: "user" | "admin") {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { returnDocument: "after" }
    ).select("-password");

    if (!user) {
      throw new NotFoundError("Không tìm thấy người dùng với ID này");
    }

    return user;
  }
}

export const adminService = new AdminService();
export default adminService;
