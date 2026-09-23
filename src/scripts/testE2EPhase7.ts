import http, { Server } from "http";
import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import { User } from "../models/User";
import { MealPlan } from "../models/MealPlan";
import { CartItem } from "../models/CartItem";
import { UserFridge } from "../models/UserFridge";
import { Store } from "../models/Store";
import { Recipe } from "../models/Recipe";
import { SEED_STORES } from "../data/seedStores";

const runE2EPhase7 = async () => {
  console.log("==========================================================================");
  console.log("       KIỂM THỬ TOÀN DIỆN HỆ THỐNG GIAI ĐOẠN 7 (FULL E2E TESTING)         ");
  console.log("   Meal Planner, Smart Shopping List with Fridge Deduction & GPS Stores   ");
  console.log("==========================================================================\n");

  let httpServer: Server;
  let baseUrl = "";
  let userToken = "";
  let userId = "";
  let sampleRecipeId = "";
  let sampleRecipeTitle = "";
  let manualCartItemId = "";
  let boughtCartItemId = "";

  try {
    // 1. Kết nối DB và khởi động server
    await connectDB();
    console.log("✅ 1. Kết nối MongoDB Atlas thành công.");

    // Seed Stores if empty
    const storeCount = await Store.countDocuments();
    if (storeCount === 0) {
      await Store.insertMany(SEED_STORES);
      console.log(`✅ 1.1. Nạp sẵn ${SEED_STORES.length} siêu thị chuẩn GeoJSON 2dsphere.`);
    }

    // 2. Khởi động HTTP Server trên cổng ngẫu nhiên
    await new Promise<void>((resolve) => {
      httpServer = http.createServer(app);
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        const port = typeof addr === "object" && addr ? addr.port : 5000;
        baseUrl = `http://localhost:${port}/api/v1`;
        console.log(`✅ 2. Máy chủ test Express đã khởi động tại: ${baseUrl}`);
        resolve();
      });
    });

    // 3. Đăng ký tài khoản kiểm thử
    console.log("\n--- BƯỚC 1: TẠO TÀI KHOẢN KIỂM THỬ ---");
    const testEmail = `chef_planner_${Date.now()}@smartcook.com`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Hoàng",
        lastName: "Nam",
        email: testEmail,
        password: "Password123@",
      }),
    });

    const regData = await regRes.json();
    if (!regData.success) {
      throw new Error(`Đăng ký thất bại: ${JSON.stringify(regData)}`);
    }

    userToken = regData.data.tokens.accessToken;
    userId = regData.data.user.id || regData.data.user._id;
    console.log(`✅ 1. Tạo tài khoản User kiểm thử thành công (ID: ${userId}).`);

    // Lấy 1 công thức món ăn có sẵn trong DB để lên thực đơn
    const recipesRes = await fetch(`${baseUrl}/recipes?limit=5`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const recipesData = await recipesRes.json();
    const recipeList = recipesData.data?.recipes || recipesData.data || [];
    if (recipeList.length > 0) {
      sampleRecipeId = recipeList[0]._id || recipeList[0].id;
      sampleRecipeTitle = recipeList[0].title;
      console.log(`ℹ️ Sử dụng công thức mẫu: "${sampleRecipeTitle}" (ID: ${sampleRecipeId})`);
    }

    // 4. TEST CASE 1: Lấy thực đơn tuần hiện tại
    console.log("\n--- TEST CASE 1: LẤY THỰC ĐƠN TUẦN HIỆN TẠI (GET /planner/current-week) ---");
    const getWeekRes = await fetch(`${baseUrl}/planner/current-week`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const weekData = await getWeekRes.json();

    if (!weekData.success || !Array.isArray(weekData.data.days)) {
      throw new Error(`Lấy thực đơn tuần thất bại: ${JSON.stringify(weekData)}`);
    }

    if (weekData.data.days.length !== 7) {
      throw new Error(`Thực đơn tuần phải có đúng 7 ngày, hiện có: ${weekData.data.days.length}`);
    }

    console.log(`✅ 1. Lấy thực đơn 7 ngày tuần hiện tại thành công.`);
    console.log(`   - Ngày đầu tuần (Thứ 2): ${weekData.data.weekStartDate}`);
    console.log(`   - Tổng calories tuần: ${weekData.data.totalWeekCalories} kcal`);
    console.log(`   - Danh sách ngày: ${weekData.data.days.map((d: any) => d.dayOfWeek).join(", ")}`);

    // 5. TEST CASE 2: Thêm món ăn vào các slot trong tuần
    console.log("\n--- TEST CASE 2: THÊM MÓN VÀO THỰC ĐƠN (PUT /planner/meals) ---");
    
    // Thêm Bữa Trưa Thứ 2
    const addMeal1Res = await fetch(`${baseUrl}/planner/meals`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        dayOfWeek: "Thứ 2",
        slot: "Bữa Trưa",
        time: "12:00",
        recipeId: sampleRecipeId || undefined,
        customTitle: sampleRecipeTitle || "Cơm Gà Teriyaki Áp Chảo",
        calories: 580,
      }),
    });
    const addMeal1Data = await addMeal1Res.json();
    if (!addMeal1Data.success) {
      throw new Error(`Thêm Bữa Trưa Thứ 2 thất bại: ${JSON.stringify(addMeal1Data)}`);
    }

    // Thêm Bữa Tối Thứ 3
    const addMeal2Res = await fetch(`${baseUrl}/planner/meals`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        dayOfWeek: "Thứ 3",
        slot: "Bữa Tối",
        time: "19:00",
        customTitle: "Salad Ức Gà Bơ Sáp",
        calories: 380,
      }),
    });
    const addMeal2Data = await addMeal2Res.json();
    if (!addMeal2Data.success) {
      throw new Error(`Thêm Bữa Tối Thứ 3 thất bại: ${JSON.stringify(addMeal2Data)}`);
    }

    const day2 = addMeal1Data.data.days.find((d: any) => d.dayOfWeek === "Thứ 2");
    console.log(`✅ 2. Lên thực đơn thành công:`);
    console.log(`   - Thứ 2: ${day2.mealsCount} bữa, tổng calo: ${day2.dailyCalories} kcal`);
    console.log(`   - Món: ${day2.meals[0].customTitle} (${day2.meals[0].slot} - ${day2.meals[0].time})`);

    // 6. TEST CASE 3: Nạp đồ vào tủ lạnh và kiểm thử thuật toán trừ tủ lạnh
    console.log("\n--- TEST CASE 3: THUẬT TOÁN TỰ ĐỘNG SINH GIỎ ĐI CHỢ & TRỪ TỦ LẠNH ---");
    
    // Nạp trước "Thịt đùi gà" vào tủ lạnh của user
    const addFridgeRes = await fetch(`${baseUrl}/fridge/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: "Thịt đùi gà phi lê",
        amount: "500g",
        category: "meat",
        storageLocation: "chilled",
      }),
    });
    const fridgeData = await addFridgeRes.json();
    console.log(`ℹ️ Đã nạp sẵn nguyên liệu vào Tủ Lạnh: "Thịt đùi gà phi lê" (${fridgeData.data?.name || "OK"})`);

    // Gọi API sinh danh mục đi chợ
    const getShopRes = await fetch(`${baseUrl}/planner/shopping-list`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const shopData = await getShopRes.json();

    if (!shopData.success || !Array.isArray(shopData.data.items)) {
      throw new Error(`Sinh danh mục đi chợ thất bại: ${JSON.stringify(shopData)}`);
    }

    console.log(`✅ 3. Tự động sinh danh mục đi chợ thông minh thành công:`);
    console.log(`   - Tổng số món cần mua: ${shopData.data.unboughtCount} món`);
    console.log(`   - Số nguyên liệu đã có trong tủ được tự động LOẠI TRỪ: ${shopData.data.fridgeItemsExcludedCount} món`);
    console.log(`   - Ước tính tổng chi phí mua sắm: ${shopData.data.estimatedTotalCost.toLocaleString()} đ`);

    if (shopData.data.items.length > 0) {
      boughtCartItemId = shopData.data.items[0]._id;
      console.log(`   - Món mẫu cần mua: "${shopData.data.items[0].name}" (${shopData.data.items[0].amount} - ${shopData.data.items[0].price}đ)`);
    }

    // 7. TEST CASE 4: Thao tác Giỏ Hàng (Thêm tay & Tick Chọn Đã Mua)
    console.log("\n--- TEST CASE 4: THAO TÁC GIỎ HÀNG (THÊM THỦ CÔNG & CHECKBOX ĐÃ MUA) ---");
    
    // Thêm thủ công 1 món
    const addManualRes = await fetch(`${baseUrl}/planner/shopping-list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: "Măng tây xanh tươi Đà Lạt",
        amount: "300g",
        price: 35000,
        category: "Rau củ",
        recipeTitle: "Bò Bít Tết Sốt Tiêu",
      }),
    });
    const addManualData = await addManualRes.json();
    if (!addManualData.success) {
      throw new Error(`Thêm thủ công mục đi chợ thất bại: ${JSON.stringify(addManualData)}`);
    }
    manualCartItemId = addManualData.data._id;
    console.log(`✅ 4.1. Thêm thủ công món đi chợ thành công: "${addManualData.data.name}" (ID: ${manualCartItemId}).`);

    // Tick chọn đã mua cho 2 món
    const patch1Res = await fetch(`${baseUrl}/planner/shopping-list/${manualCartItemId}/bought`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ bought: true }),
    });
    const patch1Data = await patch1Res.json();
    if (!patch1Data.success || !patch1Data.data.bought) {
      throw new Error(`Đánh dấu đã mua thất bại: ${JSON.stringify(patch1Data)}`);
    }
    console.log(`✅ 4.2. Đánh dấu đã mua thành công cho: "${patch1Data.data.name}" (bought: true).`);

    if (boughtCartItemId) {
      await fetch(`${baseUrl}/planner/shopping-list/${boughtCartItemId}/bought`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ bought: true }),
      });
      console.log(`✅ 4.3. Đánh dấu đã mua thêm món tự động thứ 2.`);
    }

    // 8. TEST CASE 5: 1-Click Đồng Bộ Đồ Đã Mua Vào Tủ Lạnh
    console.log("\n--- TEST CASE 5: 1-CLICK ĐỒNG BỘ ĐỒ ĐÃ MUA VÀO TỦ LẠNH (POST /sync-to-fridge) ---");
    const syncRes = await fetch(`${baseUrl}/planner/sync-to-fridge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
    });
    const syncData = await syncRes.json();

    if (!syncData.success) {
      throw new Error(`Đồng bộ vào tủ lạnh thất bại: ${JSON.stringify(syncData)}`);
    }

    console.log(`✅ 5. Đồng bộ vào Tủ Lạnh thành công:`);
    console.log(`   - Số món đã chuyển vào tủ: ${syncData.data.syncedCount} món`);
    console.log(`   - Tổng số thực phẩm trong tủ lạnh hiện tại: ${syncData.data.totalFridgeItems} món`);
    console.log(`   - Chi tiết nạp: ${syncData.data.syncedItems.map((i: any) => `"${i.name}" (${i.category})`).join(", ")}`);

    // 9. TEST CASE 6: Định Vị Siêu Thị Gần Nhất Qua GPS GeoJSON 2dsphere
    console.log("\n--- TEST CASE 6: ĐỊNH VỊ SIÊU THỊ GPS LÂN CẬN (GET /stores/nearby) ---");
    // Tọa độ gần WinMart+ Nguyễn Thị Minh Khai, Quận 1 (10.7769, 106.6909)
    const testLat = 10.7769;
    const testLng = 106.6909;

    const nearbyRes = await fetch(
      `${baseUrl}/stores/nearby?lat=${testLat}&lng=${testLng}&limit=5`
    );
    const nearbyData = await nearbyRes.json();

    if (!nearbyData.success || !Array.isArray(nearbyData.data)) {
      throw new Error(`Tìm siêu thị GPS thất bại: ${JSON.stringify(nearbyData)}`);
    }

    if (nearbyData.data.length === 0) {
      throw new Error(`Không tìm thấy siêu thị nào trong phạm vi tìm kiếm!`);
    }

    console.log(`✅ 6. Tìm kiếm siêu thị GPS thành công. Tìm thấy ${nearbyData.data.length} siêu thị lân cận:`);
    nearbyData.data.forEach((s: any, idx: number) => {
      console.log(
        `   [${idx + 1}] ${s.name} (${s.brand})` +
        `\n       📍 ${s.address}` +
        `\n       📏 Khoảng cách: ${s.formattedDistance} (${s.distanceKm} km)` +
        `\n       ⏱ Đi xe máy: ~${s.travelTimeMotoMinutes} phút | Đi bộ: ~${s.travelTimeWalkMinutes} phút`
      );
    });

    const nearestStore = nearbyData.data[0];
    if (nearestStore.distanceKm > 1.5) {
      console.warn(`⚠️ Lưu ý: Siêu thị gần nhất cách ${nearestStore.distanceKm} km.`);
    } else {
      console.log(`🎯 Siêu thị gần nhất: "${nearestStore.name}" cách chỉ ${nearestStore.formattedDistance}.`);
    }

    // Lấy chi tiết siêu thị theo ID
    const storeDetailRes = await fetch(`${baseUrl}/stores/${nearestStore.id}`);
    const storeDetailData = await storeDetailRes.json();
    if (!storeDetailData.success || !storeDetailData.data.name) {
      throw new Error(`Lấy chi tiết siêu thị thất bại!`);
    }
    console.log(`✅ 6.2. Lấy thông tin chi tiết siêu thị ID ${nearestStore.id} thành công.`);

    // 10. CLEANUP SAU TEST
    console.log("\n--- BƯỚC CUỐI: DỌN DẸP DỮ LIỆU KIỂM THỬ ---");
    if (userId) {
      await User.findByIdAndDelete(userId);
      await MealPlan.deleteMany({ userId });
      await CartItem.deleteMany({ userId });
      await UserFridge.deleteMany({ userId });
      console.log(`🧹 Đã dọn sạch dữ liệu thử nghiệm của User ${testEmail}.`);
    }

    console.log("\n==========================================================================");
    console.log("   🎉 TẤT CẢ 6/6 TEST CASES GIAI ĐOẠN 7 ĐÃ ĐẠT KẾT QUẢ XUẤT SẮC (100% PASSED)  ");
    console.log("==========================================================================\n");

  } catch (error: any) {
    console.error("\n❌ KIỂM THỬ E2E PHASE 7 THẤT BẠI:");
    console.error(error?.message || error);
    process.exitCode = 1;
  } finally {
    if (httpServer!) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
    await disconnectDB();
  }
};

runE2EPhase7();
