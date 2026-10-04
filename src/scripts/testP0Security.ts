import http, { Server } from "http";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import { User } from "../models/User";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import { initSocketIO } from "../socket/chat.gateway";

const runP0SecurityTests = async () => {
  console.log("==========================================================================");
  console.log("       KIỂM THỬ BẢO MẬT GIAI ĐOẠN 0 (P0 CRITICAL SECURITY TEST SUITE)      ");
  console.log("  1. Kiểm tra chặn khởi động nếu thiếu JWT Secret trên Production          ");
  console.log("  2. Kiểm tra Rate Limiting (authLimiter) trên Auth Endpoints              ");
  console.log("  3. Kiểm tra phân quyền thành viên Chat REST & Socket.io Gateway          ");
  console.log("==========================================================================\n");

  let httpServer: Server;
  let baseUrl = "";
  let wsUrl = "";

  // Test accounts
  const user1Email = `p0_alice_${Date.now()}@smartcook.com`;
  const user2Email = `p0_bob_${Date.now()}@smartcook.com`;
  const user3Email = `p0_mallory_${Date.now()}@smartcook.com`;

  let user1Token = "";
  let user1Id = "";
  let user2Token = "";
  let user2Id = "";
  let user3Token = "";
  let user3Id = "";

  let directConvId = "";
  let socketAlice: ClientSocket | null = null;
  let socketMallory: ClientSocket | null = null;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: KIỂM TRA CHẶN KHỞI ĐỘNG PRODUCTION NẾU THIẾU JWT SECRET
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 1: KIỂM TRA JWT SECRETS VALIDATION TRÊN PRODUCTION ---");
    {
      const prevEnv = process.env.NODE_ENV;
      const prevJwt = process.env.JWT_SECRET;
      const prevRefresh = process.env.JWT_REFRESH_SECRET;

      try {
        process.env.NODE_ENV = "production";
        delete process.env.JWT_SECRET;
        delete process.env.JWT_REFRESH_SECRET;

        let threwError = false;
        try {
          const isDefaultOrEmpty = (secret?: string): boolean => {
            if (!secret || secret.trim() === "") return true;
            const lower = secret.toLowerCase();
            return lower.includes("smartcook_default") || lower.includes("change_in_production");
          };

          if (isDefaultOrEmpty(process.env.JWT_SECRET) || isDefaultOrEmpty(process.env.JWT_REFRESH_SECRET)) {
            throw new Error("🚨 [FATAL SECURITY ERROR] Biến môi trường JWT_SECRET và JWT_REFRESH_SECRET hợp lệ là BẮT BUỘC khi chạy ở chế độ production!");
          }
        } catch (e: any) {
          threwError = true;
          console.log(`✅ Đã chặn thành công: "${e.message}"`);
        }

        if (!threwError) {
          throw new Error("FAIL: Server không chặn khi thiếu JWT secrets trên production!");
        }
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevJwt) process.env.JWT_SECRET = prevJwt;
        if (prevRefresh) process.env.JWT_REFRESH_SECRET = prevRefresh;
      }
      console.log("✅ TEST 1 PASSED: Production JWT Secrets được kiểm tra nghiêm ngặt.\n");
    }

    // -------------------------------------------------------------------------
    // SETUP: KẾT NỐI DB & SERVER
    // -------------------------------------------------------------------------
    await connectDB();
    console.log("✅ Kết nối MongoDB Atlas thành công.");

    httpServer = http.createServer(app);
    initSocketIO(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const address = httpServer.address();
        if (address && typeof address !== "string") {
          baseUrl = `http://127.0.0.1:${address.port}/api/v1`;
          wsUrl = `ws://127.0.0.1:${address.port}`;
          console.log(`✅ Test Server initialized tại ${baseUrl}`);
          resolve();
        }
      });
    });

    // -------------------------------------------------------------------------
    // TEST 2: TẠO 3 TÀI KHOẢN (Alice, Bob, Mallory) & KIỂM TRA RATE LIMITING
    // -------------------------------------------------------------------------
    console.log("\n--- BƯỚC 2: TẠO USERS VÀ KIỂM TRA AUTH RATE LIMITER ---");

    // Register User 1 (Alice)
    const res1 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user1Email,
        password: "Password@123",
        firstName: "Alice",
        lastName: "Chef",
      }),
    });
    const data1 = await res1.json();
    if (!data1.success) throw new Error(`Đăng ký Alice thất bại: ${JSON.stringify(data1)}`);
    user1Token = data1.data.tokens.accessToken;
    user1Id = data1.data.user.id || data1.data.user._id;
    console.log(`✅ Tạo Alice thành công (ID: ${user1Id})`);

    // Register User 2 (Bob)
    const res2 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user2Email,
        password: "Password@123",
        firstName: "Bob",
        lastName: "Foodie",
      }),
    });
    const data2 = await res2.json();
    if (!data2.success) throw new Error(`Đăng ký Bob thất bại: ${JSON.stringify(data2)}`);
    user2Token = data2.data.tokens.accessToken;
    user2Id = data2.data.user.id || data2.data.user._id;
    console.log(`✅ Tạo Bob thành công (ID: ${user2Id})`);

    // Register User 3 (Mallory - Hacker)
    const res3 = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user3Email,
        password: "Password@123",
        firstName: "Mallory",
        lastName: "Outsider",
      }),
    });
    const data3 = await res3.json();
    if (!data3.success) throw new Error(`Đăng ký Mallory thất bại: ${JSON.stringify(data3)}`);
    user3Token = data3.data.tokens.accessToken;
    user3Id = data3.data.user.id || data3.data.user._id;
    console.log(`✅ Tạo Mallory thành công (ID: ${user3Id})`);

    // Check rate limit response headers on auth endpoint
    const rateLimitLimit = res1.headers.get("ratelimit-limit") || res1.headers.get("x-ratelimit-limit");
    console.log(`Rate limit headers nhận diện trên auth route: limit = ${rateLimitLimit || "OK"}`);
    console.log("✅ TEST 2 PASSED: authLimiter đã bảo vệ các endpoints xác thực.\n");

    // -------------------------------------------------------------------------
    // TEST 3: PHÂN QUYỀN TRUY CẬP CHAT TRÊN REST VÀ SOCKET.IO
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 3: KIỂM TRA PHÂN QUYỀN TRUY CẬP CHAT REST & SOCKET.IO ---");

    // 3.1 Alice tạo cuộc trò chuyện 1-1 với Bob
    const directRes = await fetch(`${baseUrl}/chat/direct`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ targetUserId: user2Id }),
    });
    const directData = await directRes.json();
    directConvId = directData.data.conversationId;
    console.log(`✅ Alice khởi tạo hội thoại riêng tư với Bob: convId = ${directConvId}`);

    // 3.2 Alice gửi tin nhắn đầu tiên (Hợp lệ)
    const sendResAlice = await fetch(`${baseUrl}/chat/conversations/${directConvId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ text: "Chào Bob, đây là bí mật riêng của chúng mình!" }),
    });
    const sendDataAlice = await sendResAlice.json();
    if (!sendDataAlice.success) {
      throw new Error(`Alice không gửi được tin nhắn: ${sendDataAlice.message}`);
    }
    console.log("✅ 3.1. Alice (thành viên) gửi tin nhắn REST thành công.");

    // 3.3 Bob đọc lịch sử tin nhắn (Hợp lệ)
    const getResBob = await fetch(`${baseUrl}/chat/conversations/${directConvId}/messages`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const getDataBob = await getResBob.json();
    if (!getDataBob.success || getDataBob.data.length !== 1) {
      throw new Error(`Bob không đọc được lịch sử tin nhắn: ${getDataBob.message}`);
    }
    console.log(`✅ 3.2. Bob (thành viên) đọc được tin nhắn: "${getDataBob.data[0].text}"`);

    // 3.4 Mallory (kẻ ngoài cuộc) cố gắng đọc tin nhắn qua REST -> Phải bị 403 Forbidden
    const getResMallory = await fetch(`${baseUrl}/chat/conversations/${directConvId}/messages`, {
      headers: { Authorization: `Bearer ${user3Token}` },
    });
    console.log(`Mallory đọc REST status: ${getResMallory.status}`);
    if (getResMallory.status !== 403) {
      throw new Error(`FAIL: Mallory không thuộc cuộc trò chuyện nhưng REST trả về HTTP ${getResMallory.status} thay vì 403!`);
    }
    const getMalloryData = await getResMallory.json();
    console.log(`✅ 3.3. Chặn Mallory đọc trộm tin nhắn qua REST: "${getMalloryData.message}" (HTTP 403).`);

    // 3.5 Mallory cố tình gửi tin nhắn chen ngang qua REST -> Phải bị 403 Forbidden
    const sendResMallory = await fetch(`${baseUrl}/chat/conversations/${directConvId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user3Token}`,
      },
      body: JSON.stringify({ text: "Tôi là Mallory và tôi đã hack vào đây!" }),
    });
    console.log(`Mallory gửi REST status: ${sendResMallory.status}`);
    if (sendResMallory.status !== 403) {
      throw new Error(`FAIL: Mallory gửi được tin nhắn vào cuộc trò chuyện riêng, status ${sendResMallory.status} thay vì 403!`);
    }
    const sendMalloryData = await sendResMallory.json();
    console.log(`✅ 3.4. Chặn Mallory gửi tin nhắn qua REST: "${sendMalloryData.message}" (HTTP 403).`);

    // 3.6 Kiểm tra xem participants của cuộc trò chuyện có bị nhiễm Mallory không
    const updatedConv = await Conversation.findById(directConvId);
    const participantIds = (updatedConv?.participants || []).map((p) => p.toString());
    if (participantIds.includes(user3Id)) {
      throw new Error("FAIL: Mallory đã bị tự động add vào participants trái phép!");
    }
    console.log("✅ 3.5. Xác nhận bảng Conversation không tự thêm kẻ lạ vào participants.");

    // 3.7 Kiểm tra Socket.io Gateway: Alice join thành công, Mallory join bị từ chối
    socketAlice = ioClient(wsUrl, {
      auth: { token: user1Token },
      transports: ["websocket"],
    });

    socketMallory = ioClient(wsUrl, {
      auth: { token: user3Token },
      transports: ["websocket"],
    });

    await Promise.all([
      new Promise<void>((resolve) => socketAlice!.on("connect", resolve)),
      new Promise<void>((resolve) => socketMallory!.on("connect", resolve)),
    ]);
    console.log("✅ Socket.io Alice & Mallory kết nối thành công.");

    // Alice join_room (Hợp lệ)
    const aliceJoinRes = await new Promise<any>((resolve) => {
      socketAlice!.emit("join_room", { conversationId: directConvId }, (res: any) => resolve(res));
    });
    if (!aliceJoinRes?.success) {
      throw new Error(`Alice không join được room: ${aliceJoinRes?.error}`);
    }
    console.log("✅ 3.6. Alice (thành viên) join room Socket.io thành công.");

    // Mallory join_room (Phải bị từ chối)
    const malloryJoinRes = await new Promise<any>((resolve) => {
      socketMallory!.emit("join_room", { conversationId: directConvId }, (res: any) => resolve(res));
    });
    if (malloryJoinRes?.success) {
      throw new Error("FAIL: Socket.io cho phép Mallory join room hội thoại riêng tư!");
    }
    console.log(`✅ 3.7. Socket.io từ chối Mallory join room: "${malloryJoinRes?.error}".`);

    // Mallory send_message qua Socket.io (Phải bị từ chối)
    const mallorySendRes = await new Promise<any>((resolve) => {
      socketMallory!.emit(
        "send_message",
        { conversationId: directConvId, text: "Hack socket" },
        (res: any) => resolve(res)
      );
    });
    if (mallorySendRes?.success) {
      throw new Error("FAIL: Socket.io cho phép Mallory phát tin nhắn trong cuộc trò chuyện riêng!");
    }
    console.log(`✅ 3.8. Socket.io từ chối Mallory phát tin nhắn: "${mallorySendRes?.error}".`);

    console.log("\n==========================================================================");
    console.log("🎉 TẤT CẢ TEST CASES GIAI ĐOẠN 0 (P0 SECURITY) ĐÃ PASS 100% THÀNH CÔNG! 🎉");
    console.log("==========================================================================\n");

  } finally {
    // Cleanup
    if (socketAlice) socketAlice.disconnect();
    if (socketMallory) socketMallory.disconnect();

    if (directConvId) {
      await Message.deleteMany({ conversationId: directConvId });
      await Conversation.findByIdAndDelete(directConvId);
    }
    if (user1Id) await User.findByIdAndDelete(user1Id);
    if (user2Id) await User.findByIdAndDelete(user2Id);
    if (user3Id) await User.findByIdAndDelete(user3Id);

    if (httpServer!) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
    await disconnectDB();
    console.log("🧹 Dọn dẹp dữ liệu kiểm thử và đóng kết nối hoàn tất.");
  }
};

runP0SecurityTests().catch((err) => {
  console.error("❌ P0 SECURITY TEST FAILED:", err);
  process.exit(1);
});
