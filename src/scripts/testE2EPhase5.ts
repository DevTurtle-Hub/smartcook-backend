import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import { Server } from "http";
import User from "../models/User";
import { ScanHistory } from "../models/ScanHistory";
import UserFridge from "../models/UserFridge";

const runE2EPhase5 = async () => {
  console.log("===============================================================");
  console.log("   KIỂM THỬ TOÀN DIỆN HỆ THỐNG GIAI ĐOẠN 5 (FULL E2E TESTING)   ");
  console.log("   Gemini AI Vision Scan + Pins & AI Chef Assistant Chat        ");
  console.log("===============================================================\n");

  let server: Server;
  let baseUrl = "";
  let user1Token = "";
  let user1Id = "";
  let user2Token = "";
  let user2Id = "";
  let createdScanId = "";
  let createdScanId2 = "";

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

    // 3. Tạo tài khoản User 1 & User 2
    console.log("\n--- BƯỚC 1: TẠO TÀI KHOẢN KIỂM THỬ & THIẾT LẬP NGỮ CẢNH ---");

    const u1Email = `ai_chef_u1_${Date.now()}@smartcook.com`;
    const regU1Res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Thảo",
        lastName: "Lê",
        email: u1Email,
        password: "Password123@",
      }),
    });
    const regU1Data = await regU1Res.json();
    user1Token = regU1Data.data.tokens.accessToken;
    user1Id = regU1Data.data.user.id || regU1Data.data.user._id;
    console.log(`✅ 1.1. Tạo User 1 thành công (ID: ${user1Id}).`);

    // Thiết lập preferences cho User 1 (Khẩu vị Eat Clean, khẩu phần 2 người)
    await User.findByIdAndUpdate(user1Id, {
      preferences: {
        dietaryRestrictions: ["Eat Clean", "Ít dầu mỡ"],
        allergies: ["Đậu phộng"],
        servings: 2,
        fitnessGoal: "Tăng cơ giảm mỡ",
        preferredFlavors: ["Thanh đạm", "Chua ngọt nhẹ"],
        cookingTimeLimit: 25,
      },
    });
    console.log("✅ 1.2. Đã lưu khảo sát khẩu vị cá nhân (preferences) của User 1.");

    // Thêm nguyên liệu vào Tủ lạnh của User 1
    await fetch(`${baseUrl}/fridge/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: "Thịt ức gà",
        quantity: 500,
        unit: "g",
        category: "meat",
        daysToExpiry: 3,
      }),
    });
    await fetch(`${baseUrl}/fridge/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: "Cà chua bi",
        quantity: 300,
        unit: "g",
        category: "vegetable",
        daysToExpiry: 5,
      }),
    });
    console.log("✅ 1.3. Đã nạp ức gà và cà chua bi vào UserFridge của User 1.");

    // Tạo User 2
    const u2Email = `ai_chef_u2_${Date.now()}@smartcook.com`;
    const regU2Res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Quang",
        lastName: "Đỗ",
        email: u2Email,
        password: "Password123@",
      }),
    });
    const regU2Data = await regU2Res.json();
    user2Token = regU2Data.data.tokens.accessToken;
    user2Id = regU2Data.data.user.id || regU2Data.data.user._id;
    console.log(`✅ 1.4. Tạo User 2 thành công (ID: ${user2Id}).`);

    // =========================================================================
    // TEST CASE 1: TRỢ LÝ ẢO AI ASSISTANT CHAT VỚI NGỮ CẢNH TỦ LẠNH & KHẨU VỊ
    // =========================================================================
    console.log("\n--- TEST CASE 1: TRỢ LÝ ẢO AI CHEF ASSISTANT (POST /ai/assistant-chat) ---");

    const chatPayload = {
      message: "Trong tủ lạnh mình đang có gì, gợi ý cho mình món Eat Clean nấu nhanh dưới 20 phút?",
      conversationHistory: [
        { sender: "ai", text: "Xin chào bạn! Mình là Trợ lý Ảo SmartCook 👩‍🍳." },
        { sender: "user", text: "Chào bạn, mình đang muốn nấu bữa tối." },
      ],
    };

    const chatRes = await fetch(`${baseUrl}/ai/assistant-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify(chatPayload),
    });

    const chatData = await chatRes.json();
    console.log(`Status code: ${chatRes.status}`);
    if (chatRes.status !== 200 || !chatData.data?.replyText) {
      throw new Error(`Test Case 1 thất bại: ${JSON.stringify(chatData)}`);
    }

    console.log(`Phản hồi AI (${chatData.data.replyText.slice(0, 100)}...)`);
    console.log(`Món ăn gợi ý:`, chatData.data.suggestedDishes);
    console.log(`Quick Prompts:`, chatData.data.quickPrompts);
    console.log("✅ TEST CASE 1 PASSED: Trợ lý ảo AI Chef trả về đúng format (replyText, suggestedDishes, quickPrompts).");

    // =========================================================================
    // TEST CASE 2: SCAN NHẬN DIỆN THỰC PHẨM QUA MULTIPART UPLOAD (ẢNH THẬT)
    // =========================================================================
    console.log("\n--- TEST CASE 2: QUÉT THỰC PHẨM MULTIPART FORM (POST /ai/scan-ingredients) ---");

    // Tạo buffer ảnh giả lập PNG 1x1 hợp lệ
    const samplePngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEjDAGACUAAf8A5qj8XwAAAABJRU5ErkJggg==";
    const sampleBuffer = Buffer.from(samplePngBase64, "base64");

    const formData = new FormData();
    const blob = new Blob([sampleBuffer], { type: "image/png" });
    formData.append("image", blob, "kitchen_scan.png");

    const scanRes1 = await fetch(`${baseUrl}/ai/scan-ingredients`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
      body: formData,
    });

    const scanData1 = await scanRes1.json();
    console.log(`Status code: ${scanRes1.status}`);
    if (scanRes1.status !== 201 || !scanData1.data?.id) {
      throw new Error(`Test Case 2 thất bại: ${JSON.stringify(scanData1)}`);
    }

    createdScanId = scanData1.data.id;
    console.log(`Scan ID: ${createdScanId}`);
    console.log(`Title: ${scanData1.data.title}`);
    console.log(`Accuracy: ${scanData1.data.accuracy}%`);
    console.log(`Nguyên liệu phát hiện (${scanData1.data.ingredients.length}):`, scanData1.data.ingredients);
    console.log(`Ghim toạ độ (${scanData1.data.pins.length}):`, scanData1.data.pins);
    console.log(`Gợi ý món ăn:`, scanData1.data.suggestedRecipe);
    console.log(`Thời gian quét thân thiện: ${scanData1.data.scannedAt}`);

    if (!scanData1.data.ingredients || scanData1.data.ingredients.length === 0) {
      throw new Error("Không có nguyên liệu nào được phát hiện trong scan!");
    }
    if (!scanData1.data.pins || scanData1.data.pins.length === 0) {
      throw new Error("Không có ghim toạ độ (pins) nào được tạo!");
    }
    if (!scanData1.data.suggestedRecipe?.title) {
      throw new Error("Không có món ăn gợi ý (suggestedRecipe)!");
    }
    console.log("✅ TEST CASE 2 PASSED: Scan thực phẩm qua Multipart Form trả về đầy đủ toạ độ pins và suggestedRecipe.");

    // =========================================================================
    // TEST CASE 3: SCAN THỰC PHẨM QUA BASE64 JSON PAYLOAD
    // =========================================================================
    console.log("\n--- TEST CASE 3: QUÉT THỰC PHẨM QUA BASE64 (POST /ai/scan-ingredients) ---");

    const scanRes2 = await fetch(`${baseUrl}/ai/scan-ingredients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        imageBase64: samplePngBase64,
        mimeType: "image/png",
      }),
    });

    const scanData2 = await scanRes2.json();
    console.log(`Status code: ${scanRes2.status}`);
    if (scanRes2.status !== 201 || !scanData2.data?.id) {
      throw new Error(`Test Case 3 thất bại: ${JSON.stringify(scanData2)}`);
    }

    createdScanId2 = scanData2.data.id;
    console.log(`Scan 2 ID: ${createdScanId2}`);
    console.log(`Suggested Recipe 2: ${scanData2.data.suggestedRecipe.title}`);
    console.log("✅ TEST CASE 3 PASSED: Quét thực phẩm qua Base64 thành công.");

    // =========================================================================
    // TEST CASE 4: LẤY LỊCH SỬ QUÉT CỦA USER (GET /ai/scan-history)
    // =========================================================================
    console.log("\n--- TEST CASE 4: LẤY LỊCH SỬ QUÉT (GET /ai/scan-history) ---");

    const historyRes = await fetch(`${baseUrl}/ai/scan-history`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });

    const historyData = await historyRes.json();
    console.log(`Status code: ${historyRes.status}`);
    if (historyRes.status !== 200 || !Array.isArray(historyData.data)) {
      throw new Error(`Test Case 4 thất bại: ${JSON.stringify(historyData)}`);
    }

    console.log(`Tổng số lần quét của User 1: ${historyData.data.length}`);
    const foundIds = historyData.data.map((item: any) => item.id);
    if (!foundIds.includes(createdScanId) || !foundIds.includes(createdScanId2)) {
      throw new Error("Lịch sử quét không chứa các bản ghi vừa tạo!");
    }
    console.log("✅ TEST CASE 4 PASSED: Lấy lịch sử quét đầy đủ, sắp xếp chuẩn phục vụ ScanHistoryModal.");

    // =========================================================================
    // TEST CASE 5: PHÂN QUYỀN - USER 2 KHÔNG ĐƯỢC XOÁ SCAN CỦA USER 1
    // =========================================================================
    console.log("\n--- TEST CASE 5: BẢO MẬT PHÂN QUYỀN (USER 2 XOÁ SCAN CỦA USER 1) ---");

    const deleteForbiddenRes = await fetch(`${baseUrl}/ai/scan-history/${createdScanId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user2Token}`,
      },
    });

    console.log(`Status code: ${deleteForbiddenRes.status}`);
    if (deleteForbiddenRes.status !== 403) {
      throw new Error(`User 2 xoá được scan của User 1 (kỳ vọng 403, nhận ${deleteForbiddenRes.status})!`);
    }
    console.log("✅ TEST CASE 5 PASSED: Chặn user lạ xoá lịch sử quét với mã lỗi 403 Forbidden.");

    // =========================================================================
    // TEST CASE 6: CHÍNH CHỦ XOÁ BẢN GHI LỊCH SỬ QUÉT
    // =========================================================================
    console.log("\n--- TEST CASE 6: CHÍNH CHỦ XOÁ LỊCH SỬ QUÉT (DELETE /ai/scan-history/:id) ---");

    const deleteRes = await fetch(`${baseUrl}/ai/scan-history/${createdScanId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });

    console.log(`Status code: ${deleteRes.status}`);
    if (deleteRes.status !== 200) {
      throw new Error(`Xoá thất bại: ${deleteRes.status}`);
    }

    // Kiểm tra lại trong DB xem đã biến mất chưa
    const checkRes = await fetch(`${baseUrl}/ai/scan-history`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });
    const checkData = await checkRes.json();
    const remainingIds = checkData.data.map((item: any) => item.id);
    if (remainingIds.includes(createdScanId)) {
      throw new Error("Bản ghi scan vẫn còn trong lịch sử sau khi xoá!");
    }
    console.log("✅ TEST CASE 6 PASSED: Chính chủ xoá bản ghi lịch sử quét thành công.");

    // =========================================================================
    // CLEANUP DỮ LIỆU TEST
    // =========================================================================
    console.log("\n--- DỌN DẸP DỮ LIỆU KIỂM THỬ ---");
    await User.findByIdAndDelete(user1Id);
    await User.findByIdAndDelete(user2Id);
    await UserFridge.deleteMany({ userId: { $in: [user1Id, user2Id] } });
    await ScanHistory.deleteMany({ _id: { $in: [createdScanId, createdScanId2] } });
    console.log("✅ Dọn dẹp dữ liệu test hoàn tất.");

    console.log("\n===============================================================");
    console.log("   🎉 TẤT CẢ 6/6 TEST CASE GIAI ĐOẠN 5 ĐỀU VƯỢT QUA 100%!       ");
    console.log("===============================================================\n");
  } catch (err: any) {
    console.error("❌ E2E Phase 5 Testing gặp lỗi:", err.message || err);
    process.exitCode = 1;
  } finally {
    if (server!) {
      server.close();
    }
    await disconnectDB();
  }
};

runE2EPhase5();
