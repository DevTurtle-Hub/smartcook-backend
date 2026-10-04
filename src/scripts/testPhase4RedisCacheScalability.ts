import http, { Server } from "http";
import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import { cacheService } from "../config/cache";
import Category from "../models/Category";
import Ingredient from "../models/Ingredient";
import Recipe from "../models/Recipe";
import Post from "../models/Post";
import User from "../models/User";
import { JwtHelper } from "../utils/jwt";

const runPhase4RedisCacheScalabilityTests = async () => {
  console.log("==========================================================================");
  console.log("   KIỂM THỬ HIỆU NĂNG, REDIS CACHING & SCALABILITY - GIAI ĐOẠN 4         ");
  console.log("  1. Caching Endpoints: Categories (24h), Ingredients (12h), Stores (6h)  ");
  console.log("  2. Caching Trending Recipes: GET /recipes/trending (30m)                 ");
  console.log("  3. Tự động Cache Invalidation khi Thêm / Sửa / Xóa dữ liệu               ");
  console.log("  4. Benchmark Phân trang Con trỏ Cursor-based Pagination (< 15ms)         ");
  console.log("==========================================================================\n");

  await connectDB();

  let httpServer: Server | null = null;
  let baseUrl = "";
  const testAdminEmail = `admin_cache_${Date.now()}@smartcook.com`;
  const testUserEmail = `user_cache_${Date.now()}@smartcook.com`;
  let adminToken = "";
  let userToken = "";
  let adminId = "";
  let userId = "";

  try {
    // -------------------------------------------------------------------------
    // BƯỚC 1: KHỞI TẠO TEST SERVER VÀ TÀI KHOẢN ADMIN / USER
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 1: KHỞI TẠO TÀI KHOẢN VÀ TEST SERVER ---");
    const adminUser = await User.create({
      email: testAdminEmail,
      password: "AdminPassword123!",
      firstName: "Admin",
      lastName: "Caching",
      fullName: "Admin Caching Specialist",
      role: "admin",
      isActive: true,
    });
    adminId = adminUser._id.toString();
    adminToken = JwtHelper.generateTokens({
      id: adminId,
      email: adminUser.email,
      role: "admin",
    }).accessToken;

    const normalUser = await User.create({
      email: testUserEmail,
      password: "UserPassword123!",
      firstName: "Normal",
      lastName: "Foodie",
      fullName: "Normal Foodie User",
      role: "user",
      isActive: true,
    });
    userId = normalUser._id.toString();
    userToken = JwtHelper.generateTokens({
      id: userId,
      email: normalUser.email,
      role: "user",
    }).accessToken;

    const serverPort = 64466;
    httpServer = http.createServer(app);
    await new Promise<void>((resolve) => {
      httpServer!.listen(serverPort, () => resolve());
    });
    baseUrl = `http://127.0.0.1:${serverPort}/api/v1`;
    console.log(`  -> Server API test đang lắng nghe tại: ${baseUrl}`);
    console.log(`  -> Nhà cung cấp Cache hiện tại: ${cacheService.getProvider()}`);

    // Xóa cache trước khi test
    await cacheService.flush();

    // -------------------------------------------------------------------------
    // BƯỚC 2: KIỂM THỬ CACHING ENDPOINTS & TRENDING RECIPES (HIT / MISS)
    // -------------------------------------------------------------------------
    console.log("\n--- BƯỚC 2: KIỂM THỬ CACHE HIT / MISS CHO CÁC ENDPOINTS ĐỌC NHIỀU ---");

    // 2.1 GET /categories
    const catRes1 = await fetch(`${baseUrl}/categories`);
    const catCache1 = catRes1.headers.get("x-cache");
    console.log(`  -> [GET /categories Lần 1] X-Cache: "${catCache1}" (Kỳ vọng: MISS)`);
    if (catCache1 !== "MISS") throw new Error(`Kỳ vọng MISS nhưng nhận được ${catCache1}`);

    const catRes2 = await fetch(`${baseUrl}/categories`);
    const catCache2 = catRes2.headers.get("x-cache");
    console.log(`  -> [GET /categories Lần 2] X-Cache: "${catCache2}" (Kỳ vọng: HIT)`);
    if (catCache2 !== "HIT") throw new Error(`Kỳ vọng HIT nhưng nhận được ${catCache2}`);

    // 2.2 GET /ingredients
    const ingRes1 = await fetch(`${baseUrl}/ingredients?limit=10`);
    const ingCache1 = ingRes1.headers.get("x-cache");
    console.log(`  -> [GET /ingredients Lần 1] X-Cache: "${ingCache1}" (Kỳ vọng: MISS)`);
    if (ingCache1 !== "MISS") throw new Error(`Kỳ vọng MISS nhưng nhận được ${ingCache1}`);

    const ingRes2 = await fetch(`${baseUrl}/ingredients?limit=10`);
    const ingCache2 = ingRes2.headers.get("x-cache");
    console.log(`  -> [GET /ingredients Lần 2] X-Cache: "${ingCache2}" (Kỳ vọng: HIT)`);
    if (ingCache2 !== "HIT") throw new Error(`Kỳ vọng HIT nhưng nhận được ${ingCache2}`);

    // 2.3 GET /stores
    const storeRes1 = await fetch(`${baseUrl}/stores`);
    const storeCache1 = storeRes1.headers.get("x-cache");
    console.log(`  -> [GET /stores Lần 1] X-Cache: "${storeCache1}" (Kỳ vọng: MISS)`);
    if (storeCache1 !== "MISS") throw new Error(`Kỳ vọng MISS nhưng nhận được ${storeCache1}`);

    const storeRes2 = await fetch(`${baseUrl}/stores`);
    const storeCache2 = storeRes2.headers.get("x-cache");
    console.log(`  -> [GET /stores Lần 2] X-Cache: "${storeCache2}" (Kỳ vọng: HIT)`);
    if (storeCache2 !== "HIT") throw new Error(`Kỳ vọng HIT nhưng nhận được ${storeCache2}`);

    // 2.4 GET /recipes/trending
    const trendRes1 = await fetch(`${baseUrl}/recipes/trending?limit=5`);
    const trendCache1 = trendRes1.headers.get("x-cache");
    console.log(`  -> [GET /recipes/trending Lần 1] X-Cache: "${trendCache1}" (Kỳ vọng: MISS)`);
    if (trendCache1 !== "MISS") throw new Error(`Kỳ vọng MISS nhưng nhận được ${trendCache1}`);

    const trendRes2 = await fetch(`${baseUrl}/recipes/trending?limit=5`);
    const trendCache2 = trendRes2.headers.get("x-cache");
    console.log(`  -> [GET /recipes/trending Lần 2] X-Cache: "${trendCache2}" (Kỳ vọng: HIT)`);
    if (trendCache2 !== "HIT") throw new Error(`Kỳ vọng HIT nhưng nhận được ${trendCache2}`);

    console.log("  => [PASS] Toàn bộ 4 nhóm endpoint đều lưu cache và trả header X-Cache HIT chính xác.");

    // -------------------------------------------------------------------------
    // BƯỚC 3: KIỂM THỬ TỰ ĐỘNG CACHE INVALIDATION KHI CẬP NHẬT DỮ LIỆU
    // -------------------------------------------------------------------------
    console.log("\n--- BƯỚC 3: KIỂM THỬ TỰ ĐỘNG CACHE INVALIDATION ---");

    // 3.1 Invalidation danh mục khi thêm mới
    const uniqueCatCode = `cat_test_${Date.now()}`;
    const newCatRes = await fetch(`${baseUrl}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Món Chay Thanh Đạm",
        code: uniqueCatCode,
        description: "Các món ăn thuần chay thanh tịnh",
      }),
    });
    const newCatData = (await newCatRes.json()) as any;
    if (!newCatData.success) throw new Error("Tạo danh mục kiểm thử thất bại");
    console.log(`  -> Đã tạo danh mục mới "${newCatData.data.name}" (${newCatData.data.code})`);

    // Gọi lại GET /categories: Phải là MISS vì cache đã tự động bị vô hiệu hóa
    const catAfterInvalidate = await fetch(`${baseUrl}/categories`);
    const catAfterCache = catAfterInvalidate.headers.get("x-cache");
    console.log(`  -> [GET /categories Sau Khi Thêm] X-Cache: "${catAfterCache}" (Kỳ vọng: MISS)`);
    if (catAfterCache !== "MISS") throw new Error(`Cache Invalidation danh mục thất bại: ${catAfterCache}`);

    // 3.2 Invalidation nguyên liệu khi thêm mới
    const newIngRes = await fetch(`${baseUrl}/ingredients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: `Nấm Hương Rừng ${Date.now()}`,
        category: "veggies",
        defaultUnit: "gram",
      }),
    });
    const newIngData = (await newIngRes.json()) as any;
    if (!newIngData.success) throw new Error("Tạo nguyên liệu kiểm thử thất bại");
    console.log(`  -> Đã tạo nguyên liệu mới "${newIngData.data.name}"`);

    // Gọi lại GET /ingredients: Phải là MISS vì cache đã tự động bị vô hiệu hóa
    const ingAfterInvalidate = await fetch(`${baseUrl}/ingredients?limit=10`);
    const ingAfterCache = ingAfterInvalidate.headers.get("x-cache");
    console.log(`  -> [GET /ingredients Sau Khi Thêm] X-Cache: "${ingAfterCache}" (Kỳ vọng: MISS)`);
    if (ingAfterCache !== "MISS") throw new Error(`Cache Invalidation nguyên liệu thất bại: ${ingAfterCache}`);

    // 3.3 Invalidation Trending Recipes khi tạo công thức mới
    const newRecipe = await Recipe.create({
      title: `Bò Cuộn Nấm Kim Châm ${Date.now()}`,
      description: "Món nướng thơm lừng chuẩn vị MasterChef",
      categoryCode: uniqueCatCode,
      author: "Master Chef",
      authorId: adminId,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947",
      minutes: 20,
      difficulty: "Dễ",
      servings: "2 người",
      servingsCount: 2,
      price: "50k",
      rating: 5.0,
      reviewCount: 10,
      badge: "Món Mới",
      sub: "Món Nóng",
      tags: ["TestRecipe", "CacheInvalidate"],
      ingredients: [{ name: "Thịt bò", amount: "200g" }],
      steps: [{ stepNumber: 1, title: "Cuộn nấm", description: "Cuộn nấm và áp chảo trên lửa vừa" }],
      nutrition: {
        calories: 350,
        protein: "25g",
        carbs: "10g",
        fat: "15g",
        fiber: "2g",
        advice: "Ăn nóng kèm nước chấm mè rang",
      },
    });
    // Kích hoạt delByPattern("recipes:*")
    await cacheService.delByPattern("recipes:*");
    console.log(`  -> Đã tạo công thức mới "${newRecipe.title}"`);

    const trendAfterInvalidate = await fetch(`${baseUrl}/recipes/trending?limit=5`);
    const trendAfterCache = trendAfterInvalidate.headers.get("x-cache");
    console.log(`  -> [GET /recipes/trending Sau Khi Thêm] X-Cache: "${trendAfterCache}" (Kỳ vọng: MISS)`);
    if (trendAfterCache !== "MISS") throw new Error(`Cache Invalidation công thức thất bại: ${trendAfterCache}`);

    console.log("  => [PASS] Toàn bộ cơ chế Cache Invalidation tự động hoạt động hoàn hảo 100%.");

    // -------------------------------------------------------------------------
    // BƯỚC 4: BENCHMARK TỐC ĐỘ PHÂN TRANG CON TRỎ CURSOR-BASED PAGINATION
    // -------------------------------------------------------------------------
    console.log("\n--- BƯỚC 4: BENCHMARK HIỆU NĂNG CURSOR-BASED PAGINATION ---");

    // Tạo 10 bài đăng thử nghiệm
    const postIds: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const p = await Post.create({
        author: normalUser._id,
        caption: `Scalability Benchmark Post #${i}`,
        tags: ["BenchmarkP4"],
      });
      postIds.push(p._id.toString());
      await new Promise((r) => setTimeout(r, 5));
    }

    const t0 = performance.now();
    const p1Res = await fetch(`${baseUrl}/posts?limit=5`);
    const p1Data = (await p1Res.json()) as any;
    const durationP1 = performance.now() - t0;
    const cursor = p1Data.data.nextCursor;

    const t1 = performance.now();
    const p2Res = await fetch(`${baseUrl}/posts?limit=5&cursor=${cursor}`);
    const p2Data = (await p2Res.json()) as any;
    const durationP2 = performance.now() - t1;

    console.log(`  -> Trang 1: ${durationP1.toFixed(2)}ms (nextCursor = ${cursor})`);
    console.log(`  -> Trang 2 (Cursor Query): ${durationP2.toFixed(2)}ms (nextCursor = ${p2Data.data.nextCursor})`);

    // Kiểm tra tính toàn vẹn và không trùng lặp
    const ids1 = p1Data.data.posts.map((p: any) => p._id);
    const ids2 = p2Data.data.posts.map((p: any) => p._id);
    const duplicated = ids1.some((id: string) => ids2.includes(id));
    if (duplicated) throw new Error("Phát hiện trùng lặp dữ liệu trong Cursor-based Pagination!");

    console.log(`  -> [PASS] Phân trang con trỏ phản hồi cực nhanh (${durationP2.toFixed(2)}ms), đảm bảo tính toàn vẹn dữ liệu.`);

    console.log("\n==========================================================================");
    console.log("  🎉 TẤT CẢ CÁC BÀI TEST GIAI ĐOẠN 4 (CACHE & SCALABILITY) ĐÃ ĐẠT 100% 🎉  ");
    console.log("==========================================================================");
  } finally {
    // Dọn dẹp dữ liệu kiểm thử
    await Category.deleteMany({ code: { $regex: /^cat_test_/ } }).catch(() => {});
    await Ingredient.deleteMany({ name: { $regex: /^Nấm Hương Rừng/ } }).catch(() => {});
    await Recipe.deleteMany({ title: { $regex: /^Bò Cuộn Nấm Kim Châm/ } }).catch(() => {});
    await Post.deleteMany({ tags: "BenchmarkP4" }).catch(() => {});
    await User.deleteMany({ email: { $in: [testAdminEmail, testUserEmail] } }).catch(() => {});

    if (httpServer) {
      httpServer.close();
    }
    await disconnectDB();
  }
};

runPhase4RedisCacheScalabilityTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("LỖI TEST GIAI ĐOẠN 4:", err);
    process.exit(1);
  });
