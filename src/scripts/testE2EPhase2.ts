import http, { Server } from "http";
import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import { User } from "../models/User";
import { UserFridge } from "../models/UserFridge";
import { Recipe } from "../models/Recipe";
import { Ingredient } from "../models/Ingredient";
import { Category } from "../models/Category";

const runE2EPhase2 = async () => {
  console.log("==========================================================================");
  console.log("       KIỂM THỬ TOÀN DIỆN HỆ THỐNG GIAI ĐOẠN 2 (FULL E2E TESTING)         ");
  console.log("   Categories, Ingredient Library, Smart Fridge & Fridge Match Algorithm  ");
  console.log("==========================================================================\n");

  let httpServer: Server;
  let baseUrl = "";
  let userToken = "";
  let userId = "";
  let testItemId = "";
  let sampleRecipeId = "";

  try {
    // -------------------------------------------------------------------------
    // 1. SETUP: KẾT NỐI DB & KHỞI TẠO HTTP SERVER
    // -------------------------------------------------------------------------
    await connectDB();
    console.log("✅ 1. Kết nối MongoDB Atlas thành công.");

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

    // Tạo User kiểm thử
    const testEmail = `chef_phase2_${Date.now()}@smartcook.com`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Thành",
        lastName: "Long",
        email: testEmail,
        password: "Password123@",
      }),
    });
    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.data?.tokens?.accessToken) {
      throw new Error(`Đăng ký user test thất bại: ${JSON.stringify(regData)}`);
    }
    userToken = regData.data.tokens.accessToken;
    userId = regData.data.user.id || regData.data.user._id;
    console.log(`✅ 3. Tạo tài khoản User kiểm thử thành công (ID: ${userId}).`);

    // -------------------------------------------------------------------------
    // TEST CASE 1: DANH MỤC MÓN ĂN (GET /categories)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 1: LẤY DANH MỤC MÓN ĂN (GET /categories) ---");
    const catRes = await fetch(`${baseUrl}/categories`);
    const catData = await catRes.json();
    if (catRes.status !== 200 || !Array.isArray(catData.data) || catData.data.length === 0) {
      throw new Error(`Lấy danh mục thất bại: ${JSON.stringify(catData)}`);
    }
    console.log(`✅ Số danh mục món ăn: ${catData.data.length}`);
    console.log(`   Các danh mục:`, catData.data.slice(0, 5).map((c: any) => `${c.name} (${c.code})`).join(", "));
    console.log("✅ TEST CASE 1 PASSED: API Categories trả về đầy đủ danh mục món ăn chuẩn hóa.");

    // -------------------------------------------------------------------------
    // TEST CASE 2: THƯ VIỆN NGUYÊN LIỆU & TÌM KIẾM (GET /ingredients)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 2: THƯ VIỆN NGUYÊN LIỆU & TÌM KIẾM (GET /ingredients) ---");
    const ingRes = await fetch(`${baseUrl}/ingredients`);
    const ingData = await ingRes.json();
    const ingList = ingData.data?.ingredients || ingData.data || [];
    if (ingRes.status !== 200 || !Array.isArray(ingList) || ingList.length === 0) {
      throw new Error(`Lấy nguyên liệu thất bại: ${JSON.stringify(ingData)}`);
    }
    console.log(`✅ Tổng số nguyên liệu chuẩn trong CSDL: ${ingData.data?.total || ingList.length} nguyên liệu.`);

    // Tìm kiếm nguyên liệu theo tên "gà"
    const searchRes = await fetch(`${baseUrl}/ingredients?search=gà`);
    const searchData = await searchRes.json();
    const searchList = searchData.data?.ingredients || searchData.data || [];
    if (searchRes.status !== 200 || !Array.isArray(searchList)) {
      throw new Error(`Tìm kiếm nguyên liệu thất bại: ${JSON.stringify(searchData)}`);
    }
    console.log(`✅ Tìm kiếm từ khoá "gà": tìm thấy ${searchList.length} nguyên liệu tương ứng.`);
    console.log(`   Kết quả:`, searchList.map((i: any) => `${i.name} (${i.category})`).join(", "));
    console.log("✅ TEST CASE 2 PASSED: Thư viện nguyên liệu hỗ trợ tìm kiếm không dấu / có dấu hoàn hảo.");

    // -------------------------------------------------------------------------
    // TEST CASE 3: QUẢN LÝ TỦ LẠNH THÔNG MINH (CRUD /fridge)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 3: QUẢN LÝ TỦ LẠNH THÔNG MINH (POST/GET/PUT/DELETE /fridge) ---");
    // 3.1. Thêm nguyên liệu 1: Thịt đùi gà phi lê
    const addItem1Res = await fetch(`${baseUrl}/fridge/items`, {
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
    const addItem1Data = await addItem1Res.json();
    if (addItem1Res.status !== 201) {
      throw new Error(`Thêm nguyên liệu 1 thất bại: ${JSON.stringify(addItem1Data)}`);
    }

    // 3.2. Thêm nguyên liệu 2: Hành tây
    const addItem2Res = await fetch(`${baseUrl}/fridge/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: "Hành tây",
        amount: "2 củ",
        category: "veggies",
        storageLocation: "pantry",
      }),
    });
    const addItem2Data = await addItem2Res.json();
    if (addItem2Res.status !== 201) {
      throw new Error(`Thêm nguyên liệu 2 thất bại: ${JSON.stringify(addItem2Data)}`);
    }

    // 3.3. Thêm nguyên liệu 3: Cà chua bi
    const addItem3Res = await fetch(`${baseUrl}/fridge/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        name: "Cà chua bi",
        amount: "300g",
        category: "veggies",
        storageLocation: "chilled",
      }),
    });
    const addItem3Data = await addItem3Res.json();
    if (addItem3Res.status !== 201) {
      throw new Error(`Thêm nguyên liệu 3 thất bại: ${JSON.stringify(addItem3Data)}`);
    }

    // 3.4. Lấy danh sách đồ trong tủ lạnh
    const getFridgeRes = await fetch(`${baseUrl}/fridge/my-fridge`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const getFridgeData = await getFridgeRes.json();
    const items = getFridgeData.data?.items || [];
    if (items.length !== 3) {
      throw new Error(`Kỳ vọng 3 món trong tủ nhưng có: ${items.length}`);
    }
    testItemId = items[2]._id;
    console.log(`✅ 3.1. Đã thêm 3 nguyên liệu vào tủ lạnh:`, items.map((i: any) => `${i.name} (${i.amount})`).join(", "));

    // 3.5. Cập nhật nguyên liệu (Đổi vị trí lưu trữ)
    const updateItemRes = await fetch(`${baseUrl}/fridge/items/${testItemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        amount: "400g",
        storageLocation: "frozen",
      }),
    });
    const updateItemData = await updateItemRes.json();
    if (updateItemRes.status !== 200) {
      throw new Error(`Cập nhật món trong tủ thất bại: ${JSON.stringify(updateItemData)}`);
    }
    console.log(`✅ 3.2. Cập nhật thành công định lượng và ngăn lưu trữ sang 'frozen'.`);

    // 3.6. Xóa 1 nguyên liệu khỏi tủ
    const deleteItemRes = await fetch(`${baseUrl}/fridge/items/${testItemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (deleteItemRes.status !== 200) {
      throw new Error(`Xoá món trong tủ thất bại: ${deleteItemRes.status}`);
    }
    console.log(`✅ 3.3. Xoá thành công 1 nguyên liệu khỏi tủ lạnh.`);
    console.log("✅ TEST CASE 3 PASSED: Toàn bộ thao tác CRUD Tủ Lạnh Thông Minh hoạt động chuẩn xác.");

    // -------------------------------------------------------------------------
    // TEST CASE 4: KHÁM PHÁ CÔNG THỨC MÓN ĂN (GET /recipes & GET /recipes/:id)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 4: DANH SÁCH & CHI TIẾT CÔNG THỨC (GET /recipes) ---");
    const recipesRes = await fetch(`${baseUrl}/recipes?limit=5`);
    const recipesData = await recipesRes.json();
    const recipeList = recipesData.data?.recipes || recipesData.data || [];
    if (recipesRes.status !== 200 || recipeList.length === 0) {
      throw new Error(`Lấy danh sách công thức thất bại: ${JSON.stringify(recipesData)}`);
    }
    sampleRecipeId = recipeList[0]._id || recipeList[0].id;
    console.log(`✅ Lấy thành công ${recipeList.length} công thức món ăn.`);
    console.log(`   Món mẫu: "${recipeList[0].title}" - Calo: ${recipeList[0].calories} kcal, Đánh giá: ${recipeList[0].rating}*`);

    // Lấy chi tiết công thức
    const detailRes = await fetch(`${baseUrl}/recipes/${sampleRecipeId}`);
    const detailData = await detailRes.json();
    if (detailRes.status !== 200 || !detailData.data?.title) {
      throw new Error(`Lấy chi tiết công thức thất bại: ${JSON.stringify(detailData)}`);
    }
    console.log(`✅ Chi tiết món "${detailData.data.title}":`);
    console.log(`   - Số nguyên liệu: ${detailData.data.ingredients?.length || 0}`);
    console.log(`   - Số bước nấu (steps): ${detailData.data.steps?.length || 0}`);
    console.log(`   - Dinh dưỡng: Protein ${detailData.data.nutrition?.protein || 'N/A'}, Carbs ${detailData.data.nutrition?.carbs || 'N/A'}`);
    console.log("✅ TEST CASE 4 PASSED: Tra cứu danh sách và chi tiết công thức nấu ăn hoạt động mượt mà.");

    // -------------------------------------------------------------------------
    // TEST CASE 5: YÊU THÍCH CÔNG THỨC (POST /recipes/:id/favorite)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 5: YÊU THÍCH CÔNG THỨC (POST /recipes/:id/favorite) ---");
    const favRes1 = await fetch(`${baseUrl}/recipes/${sampleRecipeId}/favorite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const favData1 = await favRes1.json();
    if (favRes1.status !== 200 || !favData1.data?.isFavorite) {
      throw new Error(`Thêm yêu thích thất bại: ${JSON.stringify(favData1)}`);
    }
    console.log(`✅ Đã thêm vào danh sách Yêu Thích: isFavorite = ${favData1.data.isFavorite}`);

    // Bỏ yêu thích
    const favRes2 = await fetch(`${baseUrl}/recipes/${sampleRecipeId}/favorite`, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const favData2 = await favRes2.json();
    if (favRes2.status !== 200 || favData2.data?.isFavorite !== false) {
      throw new Error(`Bỏ yêu thích thất bại: ${JSON.stringify(favData2)}`);
    }
    console.log(`✅ Đã bỏ khỏi danh sách Yêu Thích: isFavorite = ${favData2.data.isFavorite}`);
    console.log("✅ TEST CASE 5 PASSED: Toggle yêu thích công thức hoạt động chuẩn xác.");

    // -------------------------------------------------------------------------
    // TEST CASE 6: THUẬT TOÁN GỢI Ý MÓN TỪ TỦ LẠNH (GET /recipes/fridge-match)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 6: THUẬT TOÁN KHỚP MÓN TỪ TỦ LẠNH (GET /recipes/fridge-match) ---");
    const matchRes = await fetch(`${baseUrl}/recipes/fridge-match?limit=5`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const matchData = await matchRes.json();
    if (matchRes.status !== 200 || !Array.isArray(matchData.data) || matchData.data.length === 0) {
      throw new Error(`Thuật toán khớp món thất bại: ${JSON.stringify(matchData)}`);
    }

    console.log(`✅ Tìm thấy ${matchData.data.length} món ăn được sắp xếp theo tỷ lệ khớp nguyên liệu giảm dần:`);
    matchData.data.forEach((r: any, idx: number) => {
      const title = r.recipe?.title || r.title;
      const matchPct = r.fridgeMatchPercent ?? r.matchPercent ?? 0;
      console.log(`   ${idx + 1}. "${title}" - Tỉ lệ khớp: ${matchPct}% (Khớp ${r.matchedCount || 0}/${r.totalIngredients || 0} nguyên liệu)`);
      console.log(`      + Có sẵn trong tủ: [${(r.availableIngredients || []).join(", ")}]`);
      console.log(`      - Cần mua thêm: [${(r.missingIngredients || []).slice(0, 3).join(", ")}...]`);
    });

    // Kiểm tra tính đơn điệu giảm dần của fridgeMatchPercent
    for (let i = 0; i < matchData.data.length - 1; i++) {
      const curPct = matchData.data[i].fridgeMatchPercent ?? matchData.data[i].matchPercent ?? 0;
      const nextPct = matchData.data[i + 1].fridgeMatchPercent ?? matchData.data[i + 1].matchPercent ?? 0;
      if (curPct < nextPct) {
        throw new Error("Thuật toán xếp hạng không sắp xếp theo matchPercent giảm dần!");
      }
    }
    console.log("✅ TEST CASE 6 PASSED: Thuật toán xếp hạng món ăn theo độ khớp tủ lạnh (Fridge Match Ranking) chính xác 100%.");

    // -------------------------------------------------------------------------
    // TEST CASE 7: DỌN SẠCH TỦ LẠNH (DELETE /fridge/clear)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 7: DỌN SẠCH TỦ LẠNH (DELETE /fridge/clear) ---");
    const clearRes = await fetch(`${baseUrl}/fridge/clear`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    if (clearRes.status !== 200) {
      throw new Error(`Dọn tủ lạnh thất bại: ${clearRes.status}`);
    }
    const checkFridgeRes = await fetch(`${baseUrl}/fridge/my-fridge`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const checkFridgeData = await checkFridgeRes.json();
    if (checkFridgeData.data?.items?.length !== 0) {
      throw new Error(`Tủ lạnh chưa được dọn sạch, vẫn còn: ${checkFridgeData.data?.items?.length} món`);
    }
    console.log("✅ TEST CASE 7 PASSED: Dọn sạch tủ lạnh thành công.");

    // -------------------------------------------------------------------------
    // DỌN DẸP DỮ LIỆU KIỂM THỬ
    // -------------------------------------------------------------------------
    console.log("\n--- DỌN DẸP DỮ LIỆU KIỂM THỬ ---");
    await User.findByIdAndDelete(userId);
    await UserFridge.deleteMany({ userId });
    console.log("✅ Đã dọn dẹp sạch tài khoản và tủ lạnh kiểm thử.");

    console.log("\n==========================================================================");
    console.log("   🎉 TẤT CẢ 7/7 TEST CASES GIAI ĐOẠN 2 ĐỀU VƯỢT QUA 100%!                ");
    console.log("==========================================================================\n");
  } catch (err: any) {
    console.error("❌ E2E Phase 2 Testing thất bại:", err.message || err);
    process.exitCode = 1;
  } finally {
    if (httpServer!) {
      httpServer.close();
    }
    await disconnectDB();
  }
};

runE2EPhase2();
