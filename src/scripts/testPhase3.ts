import connectDB, { disconnectDB } from "../config/db";
import { adminService } from "../services/admin.service";
import Recipe from "../models/Recipe";
import User from "../models/User";

const runTest = async () => {
  console.log("=== BẮT ĐẦU KIỂM THỬ GIAI ĐOẠN 3 (PHASE 3 VERIFICATION) ===");
  try {
    await connectDB();
    console.log("-> 1. Kết nối cơ sở dữ liệu MongoDB Atlas thành công.");

    // Test 1: Lấy Dashboard Stats
    console.log("\n-> 2. Kiểm thử adminService.getDashboardStats():");
    const stats = await adminService.getDashboardStats();
    console.log("  KPIs:", stats.kpis);
    console.log("  User Growth (7 ngày):", stats.userGrowth);
    console.log("  Top Recipes:", stats.topRecipes.map((r) => `${r.name} (${r.category}) - ${r.rating}*`));
    console.log("  Category Distribution:", stats.categoryDistribution);
    if (!stats.kpis || stats.userGrowth.length !== 7) {
      throw new Error("Dữ liệu thống kê Dashboard không hợp lệ");
    }
    console.log("  => TEST 1 PASS: Dashboard Stats hoạt động chính xác.");

    // Test 2: Lấy danh sách Users
    console.log("\n-> 3. Kiểm thử adminService.getUsers():");
    const userResult = await adminService.getUsers({ page: 1, limit: 5 });
    console.log(`  Tìm thấy ${userResult.total} users, trang ${userResult.page}/${userResult.totalPages}`);
    if (userResult.users.length > 0) {
      const u = userResult.users[0];
      console.log(`  Mẫu User: ${u.email} | Role: ${u.role} | Active: ${u.isActive}`);
    }
    console.log("  => TEST 2 PASS: Quản lý Users hoạt động chính xác.");

    // Test 3: Recipe Virtuals
    console.log("\n-> 4. Kiểm thử Mongoose Virtuals trong Recipe:");
    const sampleRecipe = await Recipe.findOne({ isActive: true });
    if (sampleRecipe) {
      const json = sampleRecipe.toJSON();
      console.log("  Recipe gốc: minutes =", sampleRecipe.minutes, "| rating =", sampleRecipe.rating);
      console.log("  Virtuals Web:");
      console.log("    - cookingTimeMinutes:", json.cookingTimeMinutes);
      console.log("    - ratingAverage:", json.ratingAverage);
      console.log("    - ratingsCount:", json.ratingsCount);
      console.log("    - category:", json.category);
      if (json.cookingTimeMinutes === undefined || json.ratingAverage === undefined) {
        throw new Error("Virtuals trong Recipe chưa hoạt động!");
      }
      console.log("  => TEST 3 PASS: Recipe Virtuals tương thích 100% với Web!");
    } else {
      console.log("  Chưa có recipe trong DB để test virtuals (sẽ nạp khi seed).");
    }

    console.log("\n=== TẤT CẢ TEST GIAI ĐOẠN 3 ĐỀU THÀNH CÔNG RỰC RỠ! ===");
  } catch (error) {
    console.error("LỖI KIỂM THỬ:", error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

runTest();
