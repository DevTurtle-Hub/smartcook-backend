import http, { Server } from "http";
import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import { cacheService } from "../config/cache";
import { mongoSanitize, hppProtection } from "../middlewares/security";
import User from "../models/User";
import PasswordResetOtp from "../models/PasswordResetOtp";
import { authService } from "../services/auth.service";
import { userRepository } from "../repositories/user.repository";

const runPhase3AuthSecurityTests = async () => {
  console.log("==========================================================================");
  console.log("    KIỂM THỬ XÁC THỰC & BẢO MẬT NÂNG CAO - GIAI ĐOẠN 3 (P3 TEST SUITE)    ");
  console.log("  1. Quy trình Quên & Đặt lại mật khẩu 3 bước qua Nodemailer OTP          ");
  console.log("  2. Chống NoSQL Injection & HTTP Parameter Pollution (HPP)                ");
  console.log("  3. Bộ nhớ đệm Caching Redis / In-Memory & Header X-Cache                ");
  console.log("==========================================================================\n");

  await connectDB();

  let httpServer: Server | null = null;
  let baseUrl = "";
  const testEmail = `p3_security_${Date.now()}@smartcook.com`;
  const initialPassword = "OriginalPass123!";
  const newPassword = "NewSecuredPass456!";
  let testUserId = "";

  try {
    // -------------------------------------------------------------------------
    // BƯỚC 1: KIỂM THỬ CHỐNG NOSQL INJECTION & HPP SANITIZATION
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 1: KIỂM THỬ CHỐNG NOSQL INJECTION & HPP ---");
    {
      // 1.1 Kiểm tra lọc payload chứa MongoDB operators ($gt, $ne, $where)
      const maliciousPayload = {
        email: "victim@smartcook.com",
        password: { $gt: "" }, // NoSQL auth bypass payload
        queryOptions: {
          $where: "sleep(5000)",
          validField: "smartcook",
        },
        "nested.dot.key": "injected",
      };

      const mockReq: any = {
        body: maliciousPayload,
        params: {},
        query: {
          search: "ga hap",
          $ne: "secret",
        },
      };

      mongoSanitize(mockReq, {} as any, () => {});

      // Kiểm tra req.body đã được lọc sạch toán tử $
      if (mockReq.body.password && typeof mockReq.body.password === "object") {
        if ("$gt" in mockReq.body.password) {
          throw new Error("LỖI BẢO MẬT: mongoSanitize không loại bỏ toán tử $gt trong body!");
        }
      }
      if (mockReq.body.queryOptions && "$where" in mockReq.body.queryOptions) {
        throw new Error("LỖI BẢO MẬT: mongoSanitize không loại bỏ $where!");
      }
      if ("nested.dot.key" in mockReq.body) {
        throw new Error("LỖI BẢO MẬT: mongoSanitize không loại bỏ dot-notation key!");
      }
      if ("$ne" in mockReq.query) {
        throw new Error("LỖI BẢO MẬT: mongoSanitize không loại bỏ $ne trong query string!");
      }

      console.log("  -> [PASS] Lọc sạch toàn bộ toán tử NoSQL Injection ($gt, $where, $ne, dot keys).");

      // 1.2 Kiểm tra HTTP Parameter Pollution (HPP)
      const hppReq: any = {
        query: {
          sort: ["asc", "desc"], // Bị duplicate param
          page: ["1", "2"],
          tags: ["mon-viet", "healthy"], // Nằm trong whitelist cho phép mảng
        },
      };

      const hppMiddleware = hppProtection(["tags", "cuisines"]);
      hppMiddleware(hppReq, {} as any, () => {});

      if (Array.isArray(hppReq.query.sort)) {
        throw new Error("LỖI BẢO MẬT: HPP không chuyển duplicate param về giá trị string đơn!");
      }
      if (hppReq.query.sort !== "desc") {
        throw new Error(`Kỳ vọng sort='desc', nhận '${hppReq.query.sort}'`);
      }
      if (!Array.isArray(hppReq.query.tags)) {
        throw new Error("HPP vô tình chặn mảng trong danh sách whitelist 'tags'");
      }

      console.log("  -> [PASS] Chống HTTP Parameter Pollution hoạt động chuẩn xác, giữ nguyên whitelist mảng.\n");
    }

    // -------------------------------------------------------------------------
    // BƯỚC 2: KHỞI TẠO TÀI KHOẢN VÀ TEST HTTP SERVER
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 2: KHỞI TẠO TEST SERVER VÀ TÀI KHOẢN NGƯỜI DÙNG ---");
    {
      const createdUser = await userRepository.create({
        firstName: "Nguyen",
        lastName: "Bao Mat",
        email: testEmail,
        password: initialPassword,
        role: "user",
      });
      testUserId = createdUser._id.toString();

      httpServer = http.createServer(app);
      await new Promise<void>((resolve) => {
        httpServer?.listen(0, () => resolve());
      });
      const addr = httpServer.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}/api/v1`;

      console.log(`  -> Tạo User kiểm thử: ${testEmail} (ID: ${testUserId})`);
      console.log(`  -> Server API kiểm thử chạy tại: ${baseUrl}\n`);
    }

    // -------------------------------------------------------------------------
    // BƯỚC 3: KIỂM THỬ QUY TRÌNH QUÊN & ĐẶT LẠI MẬT KHẨU (NODEMAILER OTP)
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 3: KIỂM THỬ QUY TRÌNH QUÊN & ĐẶT LẠI MẬT KHẨU 3 BƯỚC ---");
    {
      // 3.1 Gửi yêu cầu quên mật khẩu: POST /api/v1/auth/forgot-password
      const forgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail }),
      });
      const forgotData = await forgotRes.json();
      if (forgotRes.status !== 200 || !forgotData.success) {
        throw new Error(`Yêu cầu forgot-password thất bại: ${JSON.stringify(forgotData)}`);
      }

      // Kiểm tra record OTP trong Database
      const otpRecord = await PasswordResetOtp.findOne({
        email: testEmail,
        isUsed: false,
      }).sort({ createdAt: -1 }).exec();

      if (!otpRecord) {
        throw new Error("Không tìm thấy bản ghi OTP trong cơ sở dữ liệu");
      }
      if (otpRecord.expiresAt.getTime() <= Date.now()) {
        throw new Error("Thời gian hết hạn của OTP không đúng (phải trong tương lai 15 phút)");
      }
      console.log(`  -> [BƯỚC 3.1] Tạo OTP và gửi email thành công. OTP hash lưu tại DB.`);

      // 3.2 Kiểm tra xác thực OTP sai: POST /api/v1/auth/verify-otp
      const invalidVerifyRes = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, otp: "000000" }),
      });
      const invalidVerifyData = await invalidVerifyRes.json();
      if (invalidVerifyRes.status === 200) {
        throw new Error("LỖI BẢO MẬT: Mã OTP sai nhưng vẫn được chấp nhận!");
      }
      console.log(`  -> [BƯỚC 3.2] Chặn mã OTP sai đúng như kỳ vọng: "${invalidVerifyData.message}"`);

      // 3.3 Để test xác thực đúng, sinh OTP đã biết hash
      // Sử dụng service trực tiếp với OTP đã hash
      const realOtp = "789123";
      const bcrypt = (await import("bcryptjs")).default;
      otpRecord.otpHash = await bcrypt.hash(realOtp, 10);
      await otpRecord.save();

      const validVerifyRes = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, otp: realOtp }),
      });
      const validVerifyData = await validVerifyRes.json();
      if (validVerifyRes.status !== 200 || !validVerifyData.success) {
        throw new Error(`Xác thực OTP hợp lệ thất bại: ${JSON.stringify(validVerifyData)}`);
      }
      console.log(`  -> [BƯỚC 3.3] Xác thực OTP chính xác 100%.`);

      // 3.4 Đặt lại mật khẩu mới: POST /api/v1/auth/reset-password
      const resetRes = await fetch(`${baseUrl}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          otp: realOtp,
          newPassword: newPassword,
        }),
      });
      const resetData = await resetRes.json();
      if (resetRes.status !== 200 || !resetData.success) {
        throw new Error(`Đặt lại mật khẩu thất bại: ${JSON.stringify(resetData)}`);
      }

      // Xác nhận OTP đã được đánh dấu isUsed: true
      const usedRecord = await PasswordResetOtp.findById(otpRecord._id).exec();
      if (!usedRecord?.isUsed) {
        throw new Error("OTP chưa được đánh dấu isUsed sau khi đổi mật khẩu");
      }

      // 3.5 Kiểm tra đăng nhập với mật khẩu cũ -> PHẢI THẤT BẠI
      const oldLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: initialPassword }),
      });
      if (oldLoginRes.status === 200) {
        throw new Error("LỖI BẢO MẬT: Mật khẩu cũ vẫn có thể đăng nhập sau khi reset!");
      }
      console.log("  -> [BƯỚC 3.5] Đăng nhập bằng mật khẩu cũ bị từ chối thành công (HTTP 401).");

      // 3.6 Kiểm tra đăng nhập với mật khẩu mới -> PHẢI THÀNH CÔNG
      const newLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, password: newPassword }),
      });
      const newLoginData = await newLoginRes.json();
      if (newLoginRes.status !== 200 || !newLoginData.data?.tokens?.accessToken) {
        throw new Error("Đăng nhập bằng mật khẩu mới thất bại: " + JSON.stringify(newLoginData));
      }
      console.log("  -> [BƯỚC 3.6] Đăng nhập bằng mật khẩu mới thành công 100%!");
      console.log("  => [PASS] Toàn bộ chu trình Quên & Đặt lại mật khẩu qua OTP hoàn tất xuất sắc.\n");
    }

    // -------------------------------------------------------------------------
    // BƯỚC 4: KIỂM THỬ CACHING REDIS / IN-MEMORY & HEADERS X-CACHE
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 4: KIỂM THỬ BỘ NHỚ ĐỆM CACHING & HEADER X-CACHE ---");
    {
      // 4.1 Test trực tiếp cacheService CRUD
      await cacheService.set("test:greeting", { msg: "Xin chào SmartCook" }, 10);
      const cachedItem = await cacheService.get<{ msg: string }>("test:greeting");
      if (!cachedItem || cachedItem.msg !== "Xin chào SmartCook") {
        throw new Error("CacheService set/get thất bại");
      }

      await cacheService.delByPattern("test:*");
      const deletedItem = await cacheService.get("test:greeting");
      if (deletedItem !== null) {
        throw new Error("CacheService delByPattern không xoá được key");
      }
      console.log(`  -> [CacheService Provider] Đang sử dụng provider: "${cacheService.getProvider()}"`);
      console.log("  -> [PASS] CacheService CRUD và delByPattern hoạt động hoàn hảo.");

      // 4.2 Test Endpoint HTTP Caching với GET /api/v1/categories
      // Lần gọi 1: Cache Miss
      const res1 = await fetch(`${baseUrl}/categories`);
      const cacheHeader1 = res1.headers.get("x-cache");
      console.log(`  -> GET /categories (Lần 1): X-Cache = "${cacheHeader1}"`);
      if (cacheHeader1 !== "MISS") {
        throw new Error(`Kỳ vọng X-Cache='MISS' ở lần gọi đầu tiên, nhận '${cacheHeader1}'`);
      }

      // Lần gọi 2: Cache Hit
      const res2 = await fetch(`${baseUrl}/categories`);
      const cacheHeader2 = res2.headers.get("x-cache");
      console.log(`  -> GET /categories (Lần 2): X-Cache = "${cacheHeader2}"`);
      if (cacheHeader2 !== "HIT") {
        throw new Error(`Kỳ vọng X-Cache='HIT' ở lần gọi thứ hai, nhận '${cacheHeader2}'`);
      }

      console.log("  => [PASS] HTTP Cache Middleware thiết lập X-Cache HIT/MISS chính xác.\n");
    }

    console.log("==========================================================================");
    console.log("  🎉 TẤT CẢ CÁC BÀI TEST GIAI ĐOẠN 3 (AUTH & SECURITY) ĐÃ ĐẠT 100% 🎉  ");
    console.log("==========================================================================");
  } catch (error: any) {
    console.error("\n❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ GIAI ĐOẠN 3:", error);
    process.exitCode = 1;
  } finally {
    // Cleanup
    try {
      if (testUserId) await User.findByIdAndDelete(testUserId).exec();
      await PasswordResetOtp.deleteMany({ email: testEmail }).exec();
      if (httpServer) {
        await new Promise<void>((resolve) => httpServer?.close(() => resolve()));
      }
    } catch {
      // ignore
    }
    await disconnectDB();
  }
};

runPhase3AuthSecurityTests();
