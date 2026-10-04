import http, { Server } from "http";
import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import Post from "../models/Post";
import User from "../models/User";
import Report from "../models/Report";
import SystemSetting from "../models/SystemSetting";
import { JwtHelper } from "../utils/jwt";

const runPhase4AdminAndCursorTests = async () => {
  console.log("==========================================================================");
  console.log("  KIỂM THỬ GIAI ĐOẠN 4: CURSOR-BASED PAGINATION & ADMIN REAL APIS TEST   ");
  console.log("  1. Phân trang theo con trỏ Cursor-based Pagination (nextCursor)         ");
  console.log("  2. API Quản trị Báo cáo vi phạm (GET & PATCH /api/v1/admin/reports)     ");
  console.log("  3. API Cấu hình tham số Hệ thống (GET & PATCH /api/v1/admin/settings)   ");
  console.log("  4. API Giám sát & Thiết lập AI Engine (/api/v1/admin/ai-engine)         ");
  console.log("==========================================================================\n");

  await connectDB();

  let httpServer: Server | null = null;
  let baseUrl = "";
  const testAdminEmail = `admin_test_${Date.now()}@smartcook.com`;
  const testUserEmail = `user_test_${Date.now()}@smartcook.com`;
  let adminToken = "";
  let adminId = "";
  let testUserId = "";

  try {
    // -------------------------------------------------------------------------
    // BƯỚC 1: KHỞI TẠO TEST SERVER VÀ TÀI KHOẢN ADMIN / USER
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 1: KHỞI TẠO TÀI KHOẢN ADMIN VÀ SERVER KIỂM THỬ ---");
    const adminUser = await User.create({
      email: testAdminEmail,
      password: "AdminPassword123!",
      firstName: "Admin",
      lastName: "Tester",
      fullName: "Admin Controller Tester",
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
      lastName: "Author",
      fullName: "Normal Post Author",
      role: "user",
      isActive: true,
    });
    testUserId = normalUser._id.toString();

    const serverPort = 64455;
    httpServer = http.createServer(app);
    await new Promise<void>((resolve) => {
      httpServer!.listen(serverPort, () => resolve());
    });
    baseUrl = `http://127.0.0.1:${serverPort}/api/v1`;
    console.log(`  -> Admin Token đã tạo thành công cho ${testAdminEmail}`);
    console.log(`  -> Server API test đang lắng nghe tại: ${baseUrl}`);

    // -------------------------------------------------------------------------
    // BƯỚC 2: KIỂM THỬ CURSOR-BASED PAGINATION CHO BẢNG TIN CỘNG ĐỒNG
    // -------------------------------------------------------------------------
    console.log("\n--- BƯỚC 2: KIỂM THỬ CURSOR-BASED PAGINATION CHO COMMUNITY FEED ---");
    // Tạo 5 bài đăng thử nghiệm
    const postIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const p = await Post.create({
        author: normalUser._id,
        caption: `Cursor Pagination Test Post #${i}`,
        tags: ["TestCursor", `Batch${i}`],
      });
      postIds.push(p._id.toString());
      // Nghỉ 10ms để đảm bảo ObjectId timestamp tăng dần
      await new Promise((r) => setTimeout(r, 10));
    }
    console.log(`  -> Đã tạo 5 bài đăng thử nghiệm thành công (IDs: ${postIds.join(", ")})`);

    // 2.1 Fetch trang 1 với limit = 2 (không truyền cursor)
    const page1Res = await fetch(`${baseUrl}/posts?limit=2`);
    const page1Data = (await page1Res.json()) as any;
    if (!page1Data.success || page1Data.data.posts.length !== 2) {
      throw new Error(`Trang 1 thất bại: ${JSON.stringify(page1Data)}`);
    }
    const nextCursor1 = page1Data.data.nextCursor;
    console.log(`  -> [Trang 1] Nhận 2 bài viết. nextCursor = ${nextCursor1}. hasNextPage = ${page1Data.data.hasNextPage}`);
    if (!nextCursor1 || !page1Data.data.hasNextPage) {
      throw new Error("nextCursor hoặc hasNextPage không tồn tại ở trang 1");
    }

    // 2.2 Fetch trang 2 với cursor = nextCursor1 & limit = 2
    const page2Res = await fetch(`${baseUrl}/posts?limit=2&cursor=${nextCursor1}`);
    const page2Data = (await page2Res.json()) as any;
    if (!page2Data.success || page2Data.data.posts.length !== 2) {
      throw new Error(`Trang 2 thất bại: ${JSON.stringify(page2Data)}`);
    }
    const nextCursor2 = page2Data.data.nextCursor;
    console.log(`  -> [Trang 2] Nhận 2 bài viết tiếp theo. nextCursor = ${nextCursor2}. hasNextPage = ${page2Data.data.hasNextPage}`);

    // Kiểm tra không có bài đăng nào bị trùng lặp giữa trang 1 và trang 2
    const page1PostIds = page1Data.data.posts.map((p: any) => p._id);
    const page2PostIds = page2Data.data.posts.map((p: any) => p._id);
    const hasOverlap = page1PostIds.some((id: string) => page2PostIds.includes(id));
    if (hasOverlap) {
      throw new Error(`Phát hiện bài đăng trùng lặp giữa 2 trang cursor!`);
    }
    console.log("  -> [PASS] Phân trang con trỏ (Cursor-based Pagination) hoạt động chuẩn xác 100%, không trùng lặp.");

    // -------------------------------------------------------------------------
    // BƯỚC 3: KIỂM THỬ API QUẢN TRỊ BÁO CÁO VI PHẠM (ADMIN MODERATION)
    // -------------------------------------------------------------------------
    console.log("\n--- BƯỚC 3: KIỂM THỬ API QUẢN TRỊ BÁO CÁO VI PHẠM (ADMIN REPORTS) ---");
    // Tạo 1 báo cáo thử nghiệm
    const testReport = await Report.create({
      reporterId: normalUser._id,
      targetType: "post",
      targetId: postIds[0],
      reason: "spam",
      description: "Bài viết chứa liên kết spam quảng cáo sai tiêu chuẩn.",
      targetPreview: "Cursor Pagination Test Post #1",
      status: "pending",
    });
    console.log(`  -> Đã tạo báo cáo vi phạm thử nghiệm ID: ${testReport._id}`);

    // 3.1 Admin lấy danh sách báo cáo vi phạm
    const reportsRes = await fetch(`${baseUrl}/admin/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const reportsData = (await reportsRes.json()) as any;
    if (!reportsData.success || !Array.isArray(reportsData.data)) {
      throw new Error(`Admin lấy danh sách báo cáo thất bại: ${JSON.stringify(reportsData)}`);
    }
    console.log(`  -> [GET /admin/reports] Lấy thành công ${reportsData.data.length} báo cáo vi phạm.`);

    // 3.2 Admin giải quyết / xử lý báo cáo vi phạm
    const resolveRes = await fetch(`${baseUrl}/admin/reports/${testReport._id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: "resolved",
        resolutionNotes: "Đã xác nhận nội dung vi phạm tiêu chuẩn cộng đồng",
        action: "hide",
      }),
    });
    const resolveData = (await resolveRes.json()) as any;
    if (!resolveData.success || resolveData.data.status !== "resolved") {
      throw new Error(`Admin xử lý báo cáo thất bại: ${JSON.stringify(resolveData)}`);
    }
    console.log(`  -> [PATCH /admin/reports/:id] Đã xử lý báo cáo thành công (status: resolved).`);

    // -------------------------------------------------------------------------
    // BƯỚC 4: KIỂM THỬ CẤU HÌNH THAM SỐ HỆ THỐNG (SYSTEM SETTINGS)
    // -------------------------------------------------------------------------
    console.log("\n--- BƯỚC 4: KIỂM THỬ CẤU HÌNH HỆ THỐNG (SYSTEM SETTINGS) ---");
    // 4.1 Lấy cấu hình hệ thống
    const getSettingsRes = await fetch(`${baseUrl}/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getSettingsData = (await getSettingsRes.json()) as any;
    if (!getSettingsData.success || !getSettingsData.data.appName) {
      throw new Error(`Lấy cấu hình hệ thống thất bại: ${JSON.stringify(getSettingsData)}`);
    }
    console.log(`  -> [GET /admin/settings] Lấy thành công: appName="${getSettingsData.data.appName}", version="${getSettingsData.data.appVersion}"`);

    // 4.2 Cập nhật cấu hình hệ thống
    const patchSettingsRes = await fetch(`${baseUrl}/admin/settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        appName: "SmartCook Enterprise Pro 2026",
        appVersion: "2.5.0-Release",
      }),
    });
    const patchSettingsData = (await patchSettingsRes.json()) as any;
    if (!patchSettingsData.success || patchSettingsData.data.appName !== "SmartCook Enterprise Pro 2026") {
      throw new Error(`Cập nhật cấu hình hệ thống thất bại: ${JSON.stringify(patchSettingsData)}`);
    }
    console.log(`  -> [PATCH /admin/settings] Cập nhật thành công: appName="${patchSettingsData.data.appName}", version="${patchSettingsData.data.appVersion}"`);

    // -------------------------------------------------------------------------
    // BƯỚC 5: KIỂM THỬ QUẢN LÝ & GIÁM SÁT AI ENGINE
    // -------------------------------------------------------------------------
    console.log("\n--- BƯỚC 5: KIỂM THỬ QUẢN LÝ & GIÁM SÁT AI ENGINE ---");
    // 5.1 Kiểm tra trạng thái AI Engine
    const aiStatusRes = await fetch(`${baseUrl}/admin/ai-engine/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const aiStatusData = (await aiStatusRes.json()) as any;
    if (!aiStatusData.success || !aiStatusData.data.model) {
      throw new Error(`Lấy trạng thái AI Engine thất bại: ${JSON.stringify(aiStatusData)}`);
    }
    console.log(`  -> [GET /admin/ai-engine/status] Kết nối mô hình: ${aiStatusData.data.model} (Status: ${aiStatusData.data.status})`);

    // 5.2 Lấy và cập nhật cấu hình Prompt & Vision Threshold
    const getAiConfigRes = await fetch(`${baseUrl}/admin/ai-engine/config`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const getAiConfigData = (await getAiConfigRes.json()) as any;
    if (!getAiConfigData.success || !getAiConfigData.data.systemPrompt) {
      throw new Error(`Lấy cấu hình AI Engine thất bại: ${JSON.stringify(getAiConfigData)}`);
    }

    const patchAiConfigRes = await fetch(`${baseUrl}/admin/ai-engine/config`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        systemPrompt: "Bạn là Siêu Đầu Bếp SmartCook AI phiên bản 2.5 cập nhật mới nhất.",
        visionConfidenceThreshold: 90,
      }),
    });
    const patchAiConfigData = (await patchAiConfigRes.json()) as any;
    if (
      !patchAiConfigData.success ||
      patchAiConfigData.data.systemPrompt !== "Bạn là Siêu Đầu Bếp SmartCook AI phiên bản 2.5 cập nhật mới nhất." ||
      patchAiConfigData.data.visionConfidenceThreshold !== 90
    ) {
      throw new Error(`Cập nhật cấu hình AI Engine thất bại: ${JSON.stringify(patchAiConfigData)}`);
    }
    console.log(`  -> [PATCH /admin/ai-engine/config] Cập nhật Prompt và Ngưỡng Vision (90%) thành công.`);

    console.log("\n==========================================================================");
    console.log("  🎉 TẤT CẢ CÁC BÀI TEST GIAI ĐOẠN 4 ĐÃ ĐẠT 100% HOÀN HẢO 🎉  ");
    console.log("==========================================================================");
  } finally {
    // Dọn dẹp dữ liệu kiểm thử
    await Post.deleteMany({ tags: "TestCursor" }).catch(() => {});
    await User.deleteMany({ email: { $in: [testAdminEmail, testUserEmail] } }).catch(() => {});
    await Report.deleteMany({ targetPreview: "Cursor Pagination Test Post #1" }).catch(() => {});

    if (httpServer) {
      httpServer.close();
    }
    await disconnectDB();
  }
};

runPhase4AdminAndCursorTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("LỖI TEST GIAI ĐOẠN 4:", err);
    process.exit(1);
  });
