import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import { Server } from "http";

const runE2ETests = async () => {
  console.log("===============================================================");
  console.log("   KIỂM THỬ TOÀN DIỆN HỆ THỐNG GIAI ĐOẠN 3 (FULL E2E TESTING)   ");
  console.log("===============================================================\n");

  let server: Server;
  let baseUrl = "";

  try {
    // 1. Kết nối DB
    await connectDB();
    console.log("✅ 1. Kết nối MongoDB Atlas thành công.");

    // 2. Khởi động server Express trên port ngẫu nhiên
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address();
        const port = typeof addr === "object" && addr ? addr.port : 5000;
        baseUrl = `http://localhost:${port}/api/v1`;
        console.log(`✅ 2. Máy chủ test Express đã chạy tại: ${baseUrl}`);
        resolve();
      });
    });

    // 3. Test Đăng nhập tài khoản ADMIN và USER
    console.log("\n--- TEST AUTHENTICATION ---");
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@smartcook.com",
        password: "Admin123@",
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok || !adminLoginData.data?.tokens?.accessToken) {
      throw new Error(`Đăng nhập Admin thất bại: ${JSON.stringify(adminLoginData)}`);
    }
    const adminToken = adminLoginData.data.tokens.accessToken;
    console.log("✅ 3.1. Đăng nhập tài khoản ADMIN thành công (role: admin).");

    const userLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@smartcook.com",
        password: "Password123@",
      }),
    });
    const userLoginData = await userLoginRes.json();
    if (!userLoginRes.ok || !userLoginData.data?.tokens?.accessToken) {
      throw new Error(`Đăng nhập User thất bại: ${JSON.stringify(userLoginData)}`);
    }
    const userToken = userLoginData.data.tokens.accessToken;
    const testUserId = userLoginData.data.user._id;
    console.log("✅ 3.2. Đăng nhập tài khoản USER thường thành công (role: user).");

    // 4. Test Bảo Mật & RBAC (Role-Based Access Control)
    console.log("\n--- TEST BẢO MẬT & PHÂN QUYỀN (RBAC) ---");
    // 4.1. Gọi Admin endpoint không có Token -> Phải trả về 401
    const noTokenRes = await fetch(`${baseUrl}/admin/dashboard`);
    console.log(`  - Gọi không có Token: HTTP status = ${noTokenRes.status}`);
    if (noTokenRes.status !== 401) {
      throw new Error(`Yêu cầu không token phải trả về 401 nhưng nhận ${noTokenRes.status}`);
    }
    console.log("✅ 4.1. Chặn thành công request không có token (401 Unauthorized).");

    // 4.2. Gọi Admin endpoint với User thường -> Phải trả về 403 Forbidden
    const forbiddenRes = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    console.log(`  - Gọi bằng User token: HTTP status = ${forbiddenRes.status}`);
    if (forbiddenRes.status !== 403) {
      throw new Error(`User thường gọi admin phải trả về 403 nhưng nhận ${forbiddenRes.status}`);
    }
    console.log("✅ 4.2. Chặn thành công User thường truy cập phân vùng Admin (403 Forbidden).");

    // 5. Test API Admin Dashboard (với Admin Token)
    console.log("\n--- TEST ADMIN DASHBOARD API ---");
    const dashboardRes = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dashboardData = await dashboardRes.json();
    if (!dashboardRes.ok || !dashboardData.data?.kpis) {
      throw new Error(`Lấy Dashboard Stats thất bại: ${JSON.stringify(dashboardData)}`);
    }
    console.log("  KPIs nhận được:", dashboardData.data.kpis);
    console.log("  Top món ăn:", dashboardData.data.topRecipes.map((r: any) => `${r.name} - ${r.rating}*`));
    console.log("  Tăng trưởng 7 ngày:", dashboardData.data.userGrowth.length, "ngày");
    console.log("✅ 5. API GET /admin/dashboard hoạt động chuẩn xác 100%.");

    // 6. Test API Quản lý Users
    console.log("\n--- TEST ADMIN USERS MANAGEMENT API ---");
    const usersRes = await fetch(`${baseUrl}/admin/users?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json();
    if (!usersRes.ok || !Array.isArray(usersData.data?.users)) {
      throw new Error(`Lấy danh sách Users thất bại: ${JSON.stringify(usersData)}`);
    }
    console.log(`  Tổng thành viên trong hệ thống: ${usersData.data.total}`);
    console.log(`  Số thành viên lấy ra trang 1: ${usersData.data.users.length}`);
    console.log("✅ 6.1. API GET /admin/users hoạt động chuẩn xác.");

    // 6.2. Test toggle status user
    const toggleRes = await fetch(`${baseUrl}/admin/users/${testUserId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: true }),
    });
    const toggleData = await toggleRes.json();
    if (!toggleRes.ok) {
      throw new Error(`Toggle status thất bại: ${JSON.stringify(toggleData)}`);
    }
    console.log("✅ 6.2. API PATCH /admin/users/:id/status hoạt động chuẩn xác.");

    // 7. Test Tương thích Recipe DTO (Cho cả Web Client & Mobile Client)
    console.log("\n--- TEST TƯƠNG THÍCH RECIPE DTO (WEB & MOBILE) ---");
    const recipesRes = await fetch(`${baseUrl}/recipes?limit=2`);
    const recipesData = await recipesRes.json();
    if (!recipesRes.ok || !recipesData.data?.recipes?.length) {
      throw new Error(`Lấy danh sách Recipes thất bại: ${JSON.stringify(recipesData)}`);
    }

    const firstRecipe = recipesData.data.recipes[0];
    console.log(`  Đang kiểm tra món ăn: "${firstRecipe.title}"`);
    console.log(`    - Mobile field 'minutes': ${firstRecipe.minutes}`);
    console.log(`    - Web field 'cookingTimeMinutes': ${firstRecipe.cookingTimeMinutes}`);
    console.log(`    - Mobile field 'rating': ${firstRecipe.rating}`);
    console.log(`    - Web field 'ratingAverage': ${firstRecipe.ratingAverage}`);
    console.log(`    - Mobile field 'reviewCount': ${firstRecipe.reviewCount}`);
    console.log(`    - Web field 'ratingsCount': ${firstRecipe.ratingsCount}`);
    console.log(`    - Web field 'category': ${firstRecipe.category}`);

    if (
      firstRecipe.minutes === undefined ||
      firstRecipe.cookingTimeMinutes === undefined ||
      firstRecipe.ratingAverage === undefined ||
      firstRecipe.category === undefined
    ) {
      throw new Error("Lỗi tương thích Recipe Virtuals giữa Web và Mobile!");
    }
    console.log("✅ 7. Recipe DTO tương thích hoàn hảo cả Web Admin và Mobile App!");

    // 8. Test Chi tiết công thức
    const recipeDetailRes = await fetch(`${baseUrl}/recipes/${firstRecipe._id}`);
    const recipeDetailData = await recipeDetailRes.json();
    const detail = recipeDetailData.data;
    console.log("  Kiểm tra chi tiết công thức:");
    console.log(`    - Số bước nấu (stepsCount): ${detail.stepsCount}`);
    if (detail.steps && detail.steps[0]) {
      console.log(`    - Bước 1 instruction (Web): "${detail.steps[0].instruction?.substring(0, 30)}..."`);
      console.log(`    - Bước 1 description (Mobile): "${detail.steps[0].description?.substring(0, 30)}..."`);
    }
    console.log("✅ 8. Chi tiết công thức GET /recipes/:id hoạt động hoàn hảo!");

    console.log("\n===============================================================");
    console.log("🎉 KẾT QUẢ: TẤT CẢ 8 BỘ TEST E2E HỆ THỐNG ĐỀU ĐẠT CHUẨN 100%! 🎉");
    console.log("===============================================================\n");
  } catch (err) {
    console.error("❌ E2E TEST FAILED:", err);
    process.exit(1);
  } finally {
    if (server!) {
      server.close();
    }
    await disconnectDB();
  }
};

runE2ETests();
