import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import { Server } from "http";
import User from "../models/User";
import Recipe from "../models/Recipe";
import CookingHistory from "../models/CookingHistory";

const runE2EPhase4 = async () => {
  console.log("===============================================================");
  console.log("   KIỂM THỬ TOÀN DIỆN HỆ THỐNG GIAI ĐOẠN 4 (FULL E2E TESTING)   ");
  console.log("   Mở Quyền Tạo Recipe Cá Nhân & Lịch Sử Nấu Ăn (+50 XP Level)  ");
  console.log("===============================================================\n");

  let server: Server;
  let baseUrl = "";
  let user1Token = "";
  let user1Id = "";
  let user2Token = "";
  let user2Id = "";
  let adminToken = "";
  let createdRecipeId = "";
  const createdHistoryIds: string[] = [];

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

    // 3. Chuẩn bị tài khoản Admin và 2 Users kiểm thử
    console.log("\n--- BƯỚC 1: XÁC THỰC TÀI KHOẢN ---");

    // Login Admin
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
    adminToken = adminLoginData.data.tokens.accessToken;
    console.log("✅ 1.1. Đăng nhập Admin thành công.");

    // Tạo User 1 (Đầu bếp cá nhân)
    const u1Email = `chef_user1_${Date.now()}@smartcook.com`;
    const regU1Res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Hoàng",
        lastName: "Minh",
        email: u1Email,
        password: "Password123@",
      }),
    });
    const regU1Data = await regU1Res.json();
    if (!regU1Res.ok || !regU1Data.data?.tokens?.accessToken) {
      throw new Error(`Tạo User 1 thất bại: ${JSON.stringify(regU1Data)}`);
    }
    user1Token = regU1Data.data.tokens.accessToken;
    user1Id = regU1Data.data.user._id;
    console.log(`✅ 1.2. Tạo User 1 ("Hoàng Minh") thành công: ${u1Email} (ID: ${user1Id})`);

    // Tạo User 2 (Người dùng khác)
    const u2Email = `chef_user2_${Date.now()}@smartcook.com`;
    const regU2Res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Thanh",
        lastName: "Trúc",
        email: u2Email,
        password: "Password123@",
      }),
    });
    const regU2Data = await regU2Res.json();
    if (!regU2Res.ok || !regU2Data.data?.tokens?.accessToken) {
      throw new Error(`Tạo User 2 thất bại: ${JSON.stringify(regU2Data)}`);
    }
    user2Token = regU2Data.data.tokens.accessToken;
    user2Id = regU2Data.data.user._id;
    console.log(`✅ 1.3. Tạo User 2 ("Thanh Trúc") thành công: ${u2Email} (ID: ${user2Id})`);

    // 4. Test User thường tạo Recipe cá nhân (POST /recipes)
    console.log("\n--- BƯỚC 2: USER THƯỜNG TẠO RECIPE CÁ NHÂN (POST /recipes) ---");
    const customRecipePayload = {
      title: "Gà Nướng Mật Ong Tiêu Xanh",
      minutes: 40,
      difficulty: "Trung bình",
      servings: "3-4 người",
      servingsCount: 4,
      categoryCode: "family",
      badge: "Món tủ của Minh",
      sub: "Thơm lừng, da giòn óng ả",
      description: "Công thức gia truyền tự làm tại nhà cực kỳ dễ thành công.",
      image: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80",
      ingredients: [
        { name: "Đùi gà góc tư", amount: "800g" },
        { name: "Mật ong rừng", amount: "3 muỗng canh" },
        { name: "Tiêu xanh tươi", amount: "2 nhánh" },
        { name: "Dầu hào", amount: "1 muỗng canh" },
      ],
      steps: [
        {
          stepNumber: 1,
          title: "Sơ chế gà",
          description: "Khía nhẹ mặt da gà để gia vị ngấm đều, để ráo nước.",
          timerMinutes: 5,
        },
        {
          stepNumber: 2,
          title: "Ướp gia vị & Nướng",
          description: "Ướp mật ong, tiêu xanh giã dập trong 20 phút rồi nướng nồi chiên không dầu 180 độ.",
          timerMinutes: 25,
        },
      ],
      nutrition: {
        calories: 520,
        protein: "42g",
        carbs: "18g",
        fat: "22g",
      },
    };

    const createRecipeRes = await fetch(`${baseUrl}/recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify(customRecipePayload),
    });
    const createRecipeData = await createRecipeRes.json();

    if (createRecipeRes.status !== 201 || !createRecipeData.data?._id) {
      throw new Error(`User 1 tạo Recipe thất bại: ${JSON.stringify(createRecipeData)}`);
    }

    createdRecipeId = createRecipeData.data._id;
    console.log(`✅ 2.1. User 1 đã tạo thành công Recipe cá nhân: "${createRecipeData.data.title}" (Status 201).`);
    console.log(`   - ID Recipe: ${createdRecipeId}`);
    console.log(`   - Author ID: ${createRecipeData.data.authorId} (Khớp User 1: ${createRecipeData.data.authorId === user1Id})`);
    console.log(`   - Tác giả hiển thị: ${createRecipeData.data.author}`);

    if (createRecipeData.data.authorId !== user1Id) {
      throw new Error("Tác giả authorId không trùng khớp với User 1 tạo món!");
    }

    // 5. Test Phân quyền Update / Delete Recipe
    console.log("\n--- BƯỚC 3: PHÂN QUYỀN SỬA / XOÁ RECIPE ---");

    // 5.1. User 2 cố gắng sửa recipe của User 1 -> Phải bị 403 Forbidden
    const u2UpdateRes = await fetch(`${baseUrl}/recipes/${createdRecipeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ title: "Gà Nướng Của User 2 (Hack)" }),
    });
    if (u2UpdateRes.status === 403) {
      console.log("✅ 3.1. User 2 sửa công thức của User 1 bị chặn chính xác với mã 403 Forbidden.");
    } else {
      throw new Error(`Kỳ vọng mã 403 khi User 2 sửa, nhưng nhận: ${u2UpdateRes.status}`);
    }

    // 5.2. User 2 cố gắng xoá recipe của User 1 -> Phải bị 403 Forbidden
    const u2DeleteRes = await fetch(`${baseUrl}/recipes/${createdRecipeId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    if (u2DeleteRes.status === 403) {
      console.log("✅ 3.2. User 2 xoá công thức của User 1 bị chặn chính xác với mã 403 Forbidden.");
    } else {
      throw new Error(`Kỳ vọng mã 403 khi User 2 xoá, nhưng nhận: ${u2DeleteRes.status}`);
    }

    // 5.3. User 1 (Tác giả) cập nhật recipe của chính mình -> 200 OK
    const u1UpdateRes = await fetch(`${baseUrl}/recipes/${createdRecipeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ badge: "Món tủ cực hot của Minh" }),
    });
    const u1UpdateData = await u1UpdateRes.json();
    if (u1UpdateRes.status === 200 && u1UpdateData.data?.badge === "Món tủ cực hot của Minh") {
      console.log("✅ 3.3. Tác giả (User 1) cập nhật thành công công thức của mình (Status 200).");
    } else {
      throw new Error(`Tác giả cập nhật thất bại: ${JSON.stringify(u1UpdateData)}`);
    }

    // 5.4. Admin cập nhật công thức của User 1 -> 200 OK
    const adminUpdateRes = await fetch(`${baseUrl}/recipes/${createdRecipeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isPublished: true }),
    });
    if (adminUpdateRes.status === 200) {
      console.log("✅ 3.4. Quản trị viên (Admin) có toàn quyền cập nhật công thức (Status 200).");
    } else {
      throw new Error(`Admin cập nhật thất bại: ${adminUpdateRes.status}`);
    }

    // 6. Test Module Cooking History & Tích Luỹ XP (+50 XP)
    console.log("\n--- BƯỚC 4: GHI NHẬN LỊCH SỬ NẤU ĂN & CỘNG 50 XP ---");

    const cookItem1 = {
      recipeId: createdRecipeId,
      recipeName: "Gà Nướng Mật Ong Tiêu Xanh",
      durationMinutes: 35,
      servings: 3,
      calories: 520,
      rating: 5,
      usedIngredients: ["Đùi gà", "Mật ong", "Tiêu xanh"],
    };

    const cookRes1 = await fetch(`${baseUrl}/cooking-history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify(cookItem1),
    });
    const cookData1 = await cookRes1.json();

    if (cookRes1.status !== 201 || !cookData1.data?.historyItem?._id) {
      throw new Error(`Lưu lịch sử nấu ăn thất bại: ${JSON.stringify(cookData1)}`);
    }

    createdHistoryIds.push(cookData1.data.historyItem._id);
    console.log("✅ 4.1. Ghi nhận món nấu thứ 1 thành công (Status 201):");
    console.log(`   - XP nhận được: +${cookData1.data.xpEarned} XP`);
    console.log(`   - Tổng Chef XP mới: ${cookData1.data.chefExp} XP`);
    console.log(`   - Cấp bậc hiện tại: "${cookData1.data.level}"`);
    console.log(`   - Thông báo hệ thống: "${cookData1.message}"`);

    if (cookData1.data.chefExp !== 50 || cookData1.data.level !== "Tập sự") {
      throw new Error(`Số XP hoặc level không đúng sau món 1! Nhận: ${cookData1.data.chefExp}, ${cookData1.data.level}`);
    }

    // 7. Test Thăng Cấp Bậc Đầu Bếp (Chef Level Progression)
    console.log("\n--- BƯỚC 5: TIẾN TRÌNH NẤU ĂN & THĂNG CẤP BẬC ĐẦU BẾP ---");

    // Nấu món 2: +50 XP -> 100 XP ("Tập sự")
    const cookRes2 = await fetch(`${baseUrl}/cooking-history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        recipeId: createdRecipeId,
        recipeName: "Canh chua cá lóc miền Tây",
        durationMinutes: 25,
        calories: 310,
        rating: 5,
      }),
    });
    const cookData2 = await cookRes2.json();
    createdHistoryIds.push(cookData2.data.historyItem._id);
    console.log(`✅ 5.1. Món 2 hoàn thành: Chef XP = ${cookData2.data.chefExp} (Cấp: ${cookData2.data.level})`);

    // Nấu món 3: +50 XP -> 150 XP ("Tập sự")
    const cookRes3 = await fetch(`${baseUrl}/cooking-history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        recipeId: createdRecipeId,
        recipeName: "Bò lúc lắc sốt tiêu đen",
        durationMinutes: 20,
        calories: 520,
        rating: 4,
      }),
    });
    const cookData3 = await cookRes3.json();
    createdHistoryIds.push(cookData3.data.historyItem._id);
    console.log(`✅ 5.2. Món 3 hoàn thành: Chef XP = ${cookData3.data.chefExp} (Cấp: ${cookData3.data.level})`);

    // Nấu món 4: +50 XP -> 200 XP -> Vượt mốc 150 XP -> THĂNG CẤP LÊN "Bếp gia đình"!
    const cookRes4 = await fetch(`${baseUrl}/cooking-history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        recipeId: createdRecipeId,
        recipeName: "Trứng chiên thịt bằm nấm rơm",
        durationMinutes: 15,
        calories: 280,
        rating: 5,
      }),
    });
    const cookData4 = await cookRes4.json();
    createdHistoryIds.push(cookData4.data.historyItem._id);

    console.log(`✅ 5.3. Món 4 hoàn thành: Chef XP = ${cookData4.data.chefExp} XP`);
    console.log(`   - Thăng cấp thành công: ${cookData4.data.leveledUp ? "CÓ" : "KHÔNG"}`);
    console.log(`   - Cấp bậc mới: "${cookData4.data.level}"`);
    console.log(`   - Lời chúc mừng: "${cookData4.message}"`);

    if (cookData4.data.chefExp !== 200 || cookData4.data.level !== "Bếp gia đình" || !cookData4.data.leveledUp) {
      throw new Error(`Thăng cấp bậc thất bại! Kỳ vọng 200 XP, 'Bếp gia đình', leveledUp: true. Nhận: ${JSON.stringify(cookData4.data)}`);
    }

    // 8. Test Lấy Danh Sách Lịch Sử Nấu Ăn (GET /cooking-history)
    console.log("\n--- BƯỚC 6: LẤY DANH SÁCH LỊCH SỬ NẤU ĂN (GET /cooking-history) ---");
    const getHistRes = await fetch(`${baseUrl}/cooking-history?limit=10&page=1`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const getHistData = await getHistRes.json();

    if (getHistRes.status !== 200 || !Array.isArray(getHistData.data?.items)) {
      throw new Error(`Lấy danh sách lịch sử thất bại: ${JSON.stringify(getHistData)}`);
    }

    console.log(`✅ 6.1. Lấy danh sách thành công: ${getHistData.data.items.length} món đã nấu (Tổng cộng: ${getHistData.data.total})`);
    console.log(`   - Món mới nhất: "${getHistData.data.items[0].recipeName}"`);
    console.log(`   - Chef XP trả về: ${getHistData.data.chefExp} XP`);
    console.log(`   - Cấp bậc trả về: "${getHistData.data.level}"`);

    if (getHistData.data.items.length !== 4) {
      throw new Error(`Kỳ vọng 4 mục lịch sử nhưng nhận: ${getHistData.data.items.length}`);
    }

    // 9. Test Phân Quyền Xoá Lịch Sử Nấu Ăn
    console.log("\n--- BƯỚC 7: XOÁ MỤC LỊCH SỬ NẤU ĂN ---");
    const targetHistoryId = createdHistoryIds[0];

    // User 2 thử xoá bản ghi của User 1 -> 403 Forbidden
    const u2DelHistRes = await fetch(`${baseUrl}/cooking-history/${targetHistoryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    if (u2DelHistRes.status === 403) {
      console.log("✅ 7.1. User 2 xoá lịch sử của User 1 bị chặn chính xác với mã 403 Forbidden.");
    } else {
      throw new Error(`Kỳ vọng mã 403 khi User 2 xoá lịch sử, nhận: ${u2DelHistRes.status}`);
    }

    // User 1 chính chủ xoá bản ghi của mình -> 200 OK
    const u1DelHistRes = await fetch(`${baseUrl}/cooking-history/${targetHistoryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    if (u1DelHistRes.status === 200) {
      console.log("✅ 7.2. User 1 xoá thành công 1 mục lịch sử nấu ăn của mình (Status 200).");
    } else {
      throw new Error(`User 1 xoá lịch sử thất bại: ${u1DelHistRes.status}`);
    }

    // Kiểm tra lại số lượng còn lại
    const checkHistRes = await fetch(`${baseUrl}/cooking-history`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const checkHistData = await checkHistRes.json();
    console.log(`✅ 7.3. Xác nhận số lượng lịch sử sau khi xoá: ${checkHistData.data.items.length} món.`);
    if (checkHistData.data.items.length !== 3) {
      throw new Error(`Kỳ vọng 3 mục nhưng nhận: ${checkHistData.data.items.length}`);
    }

    console.log("\n===============================================================");
    console.log("   🎉 TẤT CẢ 8/8 KỊCH BẢN KIỂM THỬ GIAI ĐOẠN 4 ĐÃ ĐẠT 100%!   ");
    console.log("===============================================================\n");
  } catch (error: any) {
    console.error("\n❌ KIỂM THỬ THẤT BÀI:", error.message || error);
    process.exit(1);
  } finally {
    // Dọn dẹp tài nguyên kiểm thử
    console.log("--- DỌN DẸP DỮ LIỆU TEST ---");
    if (createdRecipeId) {
      await Recipe.findByIdAndDelete(createdRecipeId);
    }
    if (user1Id) {
      await User.findByIdAndDelete(user1Id);
      await CookingHistory.deleteMany({ userId: user1Id });
    }
    if (user2Id) {
      await User.findByIdAndDelete(user2Id);
      await CookingHistory.deleteMany({ userId: user2Id });
    }
    console.log("✅ Đã dọn dẹp sạch sẽ tài khoản và dữ liệu kiểm thử.");

    if (server!) {
      server.close();
    }
    await disconnectDB();
    console.log("✅ Đã đóng kết nối MongoDB Atlas an toàn.\n");
  }
};

runE2EPhase4();
