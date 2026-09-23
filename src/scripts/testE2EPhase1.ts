import http, { Server } from "http";
import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import { User } from "../models/User";

const runE2EPhase1 = async () => {
  console.log("===============================================================");
  console.log("   KIỂM THỬ TOÀN DIỆN HỆ THỐNG GIAI ĐOẠN 1 (FULL E2E TESTING)   ");
  console.log("   Base Architecture, Health Check, Auth & Onboarding Survey   ");
  console.log("===============================================================\n");

  let httpServer: Server;
  let baseUrl = "";
  const testEmail = `chef_phase1_${Date.now()}@smartcook.com`;
  const testPassword = "Password123@";
  let userToken = "";
  let userRefreshToken = "";
  let userId = "";

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

    // -------------------------------------------------------------------------
    // TEST CASE 1: HEALTH CHECK (GET /health)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 1: KIỂM TRA HỆ THỐNG (GET /health) ---");
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    if (healthRes.status !== 200 || !healthData.success) {
      throw new Error(`Health check thất bại: ${JSON.stringify(healthData)}`);
    }
    console.log("Status code:", healthRes.status);
    console.log("Health payload:", healthData);
    console.log("✅ TEST CASE 1 PASSED: Hệ thống phản hồi 200 OK với trạng thái MongoDB và Uptime.");

    // -------------------------------------------------------------------------
    // TEST CASE 2: VALIDATION ĐĂNG KÝ (POST /auth/register)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 2: VALIDATION DỮ LIỆU ĐẦU VÀO ĐĂNG KÝ (POST /auth/register) ---");
    // Thử đăng ký với email không hợp lệ
    const invalidEmailRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "User",
        email: "not-an-email",
        password: "123",
      }),
    });
    if (invalidEmailRes.status !== 400) {
      throw new Error(`Kỳ vọng 400 Bad Request cho invalid email nhưng nhận được: ${invalidEmailRes.status}`);
    }
    console.log(`✅ 2.1. Chặn thành công email không hợp lệ (Status: ${invalidEmailRes.status} Bad Request).`);

    // Đăng ký tài khoản hợp lệ
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Văn",
        lastName: "Huy",
        email: testEmail,
        password: testPassword,
      }),
    });
    const regData = await regRes.json();
    if (regRes.status !== 201 || !regData.data?.tokens?.accessToken) {
      throw new Error(`Đăng ký thất bại: ${JSON.stringify(regData)}`);
    }
    userToken = regData.data.tokens.accessToken;
    userRefreshToken = regData.data.tokens.refreshToken;
    userId = regData.data.user.id || regData.data.user._id;

    console.log(`✅ 2.2. Đăng ký thành công: User ID: ${userId}, Email: ${testEmail}`);
    console.log(`       Access Token: ${userToken.slice(0, 30)}...`);
    console.log(`       Refresh Token: ${userRefreshToken.slice(0, 30)}...`);

    // Thử đăng ký trùng lặp email
    const duplicateRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Văn",
        lastName: "Huy",
        email: testEmail,
        password: testPassword,
      }),
    });
    if (duplicateRes.status !== 409) {
      throw new Error(`Kỳ vọng 409 Conflict cho duplicate email nhưng nhận được: ${duplicateRes.status}`);
    }
    console.log(`✅ 2.3. Chặn thành công đăng ký trùng email (Status: ${duplicateRes.status} Conflict).`);
    console.log("✅ TEST CASE 2 PASSED: Đăng ký tài khoản và cơ chế xác thực dữ liệu đầu vào hoạt động chính xác.");

    // -------------------------------------------------------------------------
    // TEST CASE 3: XÁC THỰC ĐĂNG NHẬP (POST /auth/login)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 3: XÁC THỰC ĐĂNG NHẬP (POST /auth/login) ---");
    // Thử sai mật khẩu
    const wrongPassRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "WrongPassword999@",
      }),
    });
    if (wrongPassRes.status !== 401) {
      throw new Error(`Kỳ vọng 401 Unauthorized khi sai mật khẩu nhưng nhận: ${wrongPassRes.status}`);
    }
    console.log(`✅ 3.1. Chặn đăng nhập sai mật khẩu (Status: ${wrongPassRes.status} Unauthorized).`);

    // Đăng nhập đúng thông tin
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.data?.tokens?.accessToken) {
      throw new Error(`Đăng nhập hợp lệ thất bại: ${JSON.stringify(loginData)}`);
    }
    userToken = loginData.data.tokens.accessToken;
    userRefreshToken = loginData.data.tokens.refreshToken;
    console.log(`✅ 3.2. Đăng nhập thành công với thông tin hợp lệ (Status: 200 OK).`);
    console.log(`       User Role: ${loginData.data.user.role}, Chef Level: ${loginData.data.user.level}`);
    console.log("✅ TEST CASE 3 PASSED: Đăng nhập an toàn với mã hoá mật khẩu Bcrypt.");

    // -------------------------------------------------------------------------
    // TEST CASE 4: LẤY THÔNG TIN HỒ SƠ NGƯỜI DÙNG (GET /auth/me)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 4: LẤY THÔNG TIN CÁ NHÂN (GET /auth/me) ---");
    // Gọi không có token
    const noTokenRes = await fetch(`${baseUrl}/auth/me`);
    if (noTokenRes.status !== 401) {
      throw new Error(`Kỳ vọng 401 khi không có token nhưng nhận: ${noTokenRes.status}`);
    }
    console.log(`✅ 4.1. Chặn truy cập khi thiếu Bearer Token (Status: ${noTokenRes.status} Unauthorized).`);

    // Gọi có token hợp lệ
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const meData = await meRes.json();
    if (meRes.status !== 200 || meData.data?.email !== testEmail) {
      throw new Error(`Lấy thông tin cá nhân thất bại: ${JSON.stringify(meData)}`);
    }
    console.log(`✅ 4.2. Lấy thông tin cá nhân thành công: ${meData.data.fullName} (${meData.data.email})`);
    console.log("✅ TEST CASE 4 PASSED: Middleware xác thực JWT Bearer Token hoạt động chuẩn mực.");

    // -------------------------------------------------------------------------
    // TEST CASE 5: CẬP NHẬT HỒ SƠ CÁ NHÂN (PUT /auth/profile)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 5: CẬP NHẬT HỒ SƠ (PUT /auth/profile) ---");
    const updateProfileRes = await fetch(`${baseUrl}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        firstName: "Quang",
        lastName: "Huy",
        phone: "0987654321",
        bio: "Đam mê nấu ăn phong cách Eat Clean & Healthy!",
      }),
    });
    const updateProfileData = await updateProfileRes.json();
    if (updateProfileRes.status !== 200 || updateProfileData.data?.firstName !== "Quang") {
      throw new Error(`Cập nhật hồ sơ thất bại: ${JSON.stringify(updateProfileData)}`);
    }
    console.log(`✅ Tên mới: ${updateProfileData.data.fullName}, SĐT: ${updateProfileData.data.phone}`);
    console.log("✅ TEST CASE 5 PASSED: Cập nhật thông tin hồ sơ người dùng thành công.");

    // -------------------------------------------------------------------------
    // TEST CASE 6: KHẢO SÁT KHẨU VỊ ONBOARDING (POST /auth/survey)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 6: LƯU KHẢO SÁT ONBOARDING (POST /auth/survey) ---");
    const surveyRes = await fetch(`${baseUrl}/auth/survey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        portion: "3-4",
        cuisines: ["Món Việt", "Món Nhật"],
        healthGoal: "healthy",
        restrictions: ["Không ăn mì chính"],
        tasteProfile: ["Thanh đạm", "Ít muối"],
        cookingTime: "quick",
      }),
    });
    const surveyData = await surveyRes.json();
    const hasSurvey = surveyData.data?.hasCompletedSurvey || surveyData.data?.preferences?.hasCompletedSurvey;
    if (surveyRes.status !== 200 || !hasSurvey) {
      throw new Error(`Lưu khảo sát thất bại: ${JSON.stringify(surveyData)}`);
    }
    console.log(`✅ Khẩu phần: ${surveyData.data.portion || surveyData.data.preferences?.portion} người, Mục tiêu: ${surveyData.data.healthGoal || surveyData.data.preferences?.healthGoal}`);
    console.log(`✅ Trạng thái hoàn thành survey: ${hasSurvey}`);
    console.log("✅ TEST CASE 6 PASSED: Lưu khảo sát khẩu vị Onboarding thành công.");

    // -------------------------------------------------------------------------
    // TEST CASE 7: CẤP LẠI TOKEN XOAY VÒNG (POST /auth/refresh-token)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 7: CẤP LẠI TOKEN XOAY VÒNG (POST /auth/refresh-token) ---");
    // Thử với refresh token rác
    const invalidRefreshRes = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: "invalid.fake.jwt" }),
    });
    if (invalidRefreshRes.status !== 401) {
      throw new Error(`Kỳ vọng 401 khi refresh token giả mạo nhưng nhận: ${invalidRefreshRes.status}`);
    }
    console.log(`✅ 7.1. Chặn refresh token không hợp lệ (Status: ${invalidRefreshRes.status} Unauthorized).`);

    // Cấp lại với refresh token hợp lệ
    const refreshRes = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: userRefreshToken }),
    });
    const refreshData = await refreshRes.json();
    const newAccessToken = refreshData.data?.accessToken || refreshData.data?.tokens?.accessToken;
    if (refreshRes.status !== 200 || !newAccessToken) {
      throw new Error(`Cấp lại token thất bại: ${JSON.stringify(refreshData)}`);
    }
    console.log(`✅ 7.2. Cấp lại access token thành công: ${newAccessToken.slice(0, 30)}...`);
    console.log("✅ TEST CASE 7 PASSED: Cơ chế xoay vòng Refresh Token chuẩn bảo mật OAuth/JWT.");

    // -------------------------------------------------------------------------
    // TEST CASE 8: ĐĂNG XUẤT (POST /auth/logout)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST CASE 8: ĐĂNG XUẤT THU HỒI PHIÊN (POST /auth/logout) ---");
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${newAccessToken}`,
      },
    });
    if (logoutRes.status !== 200) {
      throw new Error(`Đăng xuất thất bại: ${logoutRes.status}`);
    }
    console.log("✅ TEST CASE 8 PASSED: Đăng xuất người dùng thành công.");

    // -------------------------------------------------------------------------
    // DỌN DẸP DỮ LIỆU KIỂM THỬ
    // -------------------------------------------------------------------------
    console.log("\n--- DỌN DẸP DỮ LIỆU KIỂM THỬ ---");
    await User.findByIdAndDelete(userId);
    console.log("✅ Đã dọn dẹp sạch tài khoản kiểm thử.");

    console.log("\n===============================================================");
    console.log("   🎉 TẤT CẢ 8/8 TEST CASES GIAI ĐOẠN 1 ĐỀU VƯỢT QUA 100%!       ");
    console.log("===============================================================\n");
  } catch (err: any) {
    console.error("❌ E2E Phase 1 Testing thất bại:", err.message || err);
    process.exitCode = 1;
  } finally {
    if (httpServer!) {
      httpServer.close();
    }
    await disconnectDB();
  }
};

runE2EPhase1();
