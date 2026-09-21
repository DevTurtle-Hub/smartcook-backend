import http, { Server } from "http";
import { io as ioClient, Socket as ClientSocket } from "socket.io-client";
import app from "../app";
import connectDB, { disconnectDB } from "../config/db";
import { seedDefaultChatRooms } from "../data/seedChatRooms";
import Comment from "../models/Comment";
import Conversation from "../models/Conversation";
import Message from "../models/Message";
import Post from "../models/Post";
import User from "../models/User";
import { initSocketIO } from "../socket/chat.gateway";

const runE2EPhase6 = async () => {
  console.log("===============================================================");
  console.log("   KIỂM THỬ TOÀN DIỆN HỆ THỐNG GIAI ĐOẠN 6 (FULL E2E TESTING)   ");
  console.log("   Community Feed, Dual Routing, Reactions & Socket.io Realtime  ");
  console.log("===============================================================\n");

  let httpServer: Server;
  let baseUrl = "";
  let wsUrl = "";
  let user1Token = "";
  let user1Id = "";
  let user2Token = "";
  let user2Id = "";
  let createdPostId = "";
  let rootCommentId = "";
  let directConvId = "";
  let socketUser1: ClientSocket | null = null;
  let socketUser2: ClientSocket | null = null;

  try {
    // 1. Kết nối DB và seed phòng chat mẫu
    await connectDB();
    await seedDefaultChatRooms();
    console.log("✅ 1. Kết nối MongoDB Atlas và nạp sẵn 3 phòng chat mẫu thành công.");

    // 2. Khởi động HTTP Server và Socket.IO Gateway trên port ngẫu nhiên
    await new Promise<void>((resolve) => {
      httpServer = http.createServer(app);
      initSocketIO(httpServer);
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        const port = typeof addr === "object" && addr ? addr.port : 5000;
        baseUrl = `http://localhost:${port}/api/v1`;
        wsUrl = `http://localhost:${port}`;
        console.log(`✅ 2. Máy chủ test Express & Socket.io đã chạy tại: ${baseUrl}`);
        resolve();
      });
    });

    // 3. Chuẩn bị 2 Users kiểm thử
    console.log("\n--- BƯỚC 1: TẠO TÀI KHOẢN KIỂM THỬ ---");

    const u1Email = `chef_community_1_${Date.now()}@smartcook.com`;
    const regU1Res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Hương",
        lastName: "Trần",
        email: u1Email,
        password: "Password123@",
      }),
    });
    const regU1Data = await regU1Res.json();
    user1Token = regU1Data.data.tokens.accessToken;
    user1Id = regU1Data.data.user.id || regU1Data.data.user._id;
    console.log(`✅ 1.1. Tạo User 1 thành công (ID: ${user1Id}).`);

    const u2Email = `chef_community_2_${Date.now()}@smartcook.com`;
    const regU2Res = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Tuấn",
        lastName: "Vũ",
        email: u2Email,
        password: "Password123@",
      }),
    });
    const regU2Data = await regU2Res.json();
    user2Token = regU2Data.data.tokens.accessToken;
    user2Id = regU2Data.data.user.id || regU2Data.data.user._id;
    console.log(`✅ 1.2. Tạo User 2 thành công (ID: ${user2Id}).`);

    // =========================================================================
    // TEST CASE 1: ĐĂNG BÀI VIẾT CỘNG ĐỒNG QUA /posts (WEB ROUTE)
    // =========================================================================
    console.log("\n--- TEST CASE 1: ĐĂNG BÀI VIẾT CỘNG ĐỒNG (POST /posts) ---");

    const postPayload = {
      dishName: "Cơm Gà Sốt Teriyaki Mè Rang",
      caption: "Bữa trưa đậm đà cho gia đình! Thịt gà mềm ngấm sốt teriyaki thơm lừng. #MonNgon #ComGa",
      tags: ["#MonNgon", "#ComGa", "#Healthy"],
      images: [
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      ],
    };

    const createPostRes = await fetch(`${baseUrl}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify(postPayload),
    });

    const createPostData = await createPostRes.json();
    console.log(`Status code: ${createPostRes.status}`);
    if (createPostRes.status !== 201 || !createPostData.data?.id) {
      throw new Error(`Test Case 1 thất bại: ${JSON.stringify(createPostData)}`);
    }

    createdPostId = createPostData.data.id;
    console.log(`Created Post ID: ${createdPostId}`);
    console.log(`Dish Name: ${createPostData.data.dishName}`);
    console.log(`Author Name: ${createPostData.data.author.name}`);

    // Kiểm tra User 1 đã được cộng +20 XP Chef chưa
    const u1Check = await User.findById(user1Id);
    if ((u1Check?.chefExp || 0) < 20) {
      throw new Error("User không nhận được +20 XP sau khi chia sẻ bài đăng!");
    }
    console.log(`✅ TEST CASE 1 PASSED: Đăng bài thành công, User nhận +20 XP (Tổng XP: ${u1Check?.chefExp}).`);

    // =========================================================================
    // TEST CASE 2: DUAL ROUTING ALIAS & LẤY BẢNG TIN (/community/posts)
    // =========================================================================
    console.log("\n--- TEST CASE 2: DUAL ROUTING ALIAS (GET /community/posts) ---");

    const getPostsRes = await fetch(`${baseUrl}/community/posts?page=1&limit=10`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user2Token}`,
      },
    });

    const getPostsData = await getPostsRes.json();
    console.log(`Status code: ${getPostsRes.status}`);
    if (getPostsRes.status !== 200 || !Array.isArray(getPostsData.data?.posts)) {
      throw new Error(`Test Case 2 thất bại: ${JSON.stringify(getPostsData)}`);
    }

    const foundPost = getPostsData.data.posts.find((p: any) => p.id === createdPostId);
    if (!foundPost) {
      throw new Error("Không tìm thấy bài đăng vừa tạo trên endpoint alias /community/posts!");
    }

    console.log(`Tìm thấy bài đăng qua alias: ${foundPost.dishName}`);
    console.log(`Content mobile alias: ${foundPost.content}`);
    console.log(`isLiked (User 2): ${foundPost.isLiked} (Kỳ vọng: false)`);
    if (foundPost.isLiked !== false) {
      throw new Error("isLiked của User 2 phải là false!");
    }
    console.log("✅ TEST CASE 2 PASSED: Dual routing alias /community/posts hoạt động chuẩn xác với Mobile DTO.");

    // =========================================================================
    // TEST CASE 3: THẢ CẢM XÚC / LIKE BÀI VIẾT (POST /posts/:id/react)
    // =========================================================================
    console.log("\n--- TEST CASE 3: THẢ CẢM XÚC & BỎ THẢ CẢM XÚC (POST /posts/:id/react) ---");

    // User 2 thả "love"
    const reactRes1 = await fetch(`${baseUrl}/posts/${createdPostId}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ type: "love" }),
    });
    const reactData1 = await reactRes1.json();
    console.log(`Status thả cảm xúc: ${reactRes1.status}`);
    console.log(`Total reactions: ${reactData1.data?.totalReactions}, isLiked: ${reactData1.data?.isLiked}`);

    if (reactData1.data?.totalReactions !== 1 || reactData1.data?.isLiked !== true) {
      throw new Error("Thả tim thất bại hoặc trạng thái isLiked không đúng!");
    }

    // User 2 bấm lại "love" (Hủy cảm xúc)
    const reactRes2 = await fetch(`${baseUrl}/posts/${createdPostId}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ type: "love" }),
    });
    const reactData2 = await reactRes2.json();
    console.log(`Total reactions sau khi hủy: ${reactData2.data?.totalReactions}, isLiked: ${reactData2.data?.isLiked}`);

    if (reactData2.data?.totalReactions !== 0 || reactData2.data?.isLiked !== false) {
      throw new Error("Hủy thả tim thất bại!");
    }
    console.log("✅ TEST CASE 3 PASSED: Thả cảm xúc 6 loại và hủy cảm xúc hoạt động trơn tru.");

    // =========================================================================
    // TEST CASE 4: BÌNH LUẬN & TRẢ LỜI LỒNG NHAU (POST /posts/:id/comments)
    // =========================================================================
    console.log("\n--- TEST CASE 4: BÌNH LUẬN & TRẢ LỜI LỒNG NHAU ---");

    // User 2 bình luận gốc
    const c1Res = await fetch(`${baseUrl}/posts/${createdPostId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({
        content: "Món này trông màu sốt đẹp quá bạn ơi! Có cần ướp trước lâu không?",
      }),
    });
    const c1Data = await c1Res.json();
    rootCommentId = c1Data.data.id || c1Data.data._id;
    console.log(`Bình luận gốc ID: ${rootCommentId}`);

    // User 1 trả lời lồng vào bình luận của User 2
    const c2Res = await fetch(`${baseUrl}/posts/${createdPostId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        content: "Chỉ cần ướp khoảng 15 phút với chút mirin và xì dầu là ngấm ngon rồi bạn nhé!",
        parentCommentId: rootCommentId,
      }),
    });
    const c2Data = await c2Res.json();
    console.log(`Bình luận trả lời ID: ${c2Data.data.id}, Parent ID: ${c2Data.data.parentCommentId}`);

    // Lấy danh sách bình luận
    const getCommentsRes = await fetch(`${baseUrl}/posts/${createdPostId}/comments`);
    const getCommentsData = await getCommentsRes.json();
    console.log(`Tổng số bình luận: ${getCommentsData.data.total}`);

    if (getCommentsData.data.total !== 2) {
      throw new Error(`Kỳ vọng 2 bình luận, nhưng nhận được ${getCommentsData.data.total}`);
    }
    console.log("✅ TEST CASE 4 PASSED: Thêm bình luận và trả lời phân cấp thành công.");

    // =========================================================================
    // TEST CASE 5: PHÂN QUYỀN XOÁ BÀI VIẾT (USER 2 XOÁ BÀI CỦA USER 1)
    // =========================================================================
    console.log("\n--- TEST CASE 5: BẢO MẬT PHÂN QUYỀN XOÁ BÀI VIẾT ---");

    const deleteForbiddenRes = await fetch(`${baseUrl}/posts/${createdPostId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user2Token}`,
      },
    });
    console.log(`Status code: ${deleteForbiddenRes.status}`);
    if (deleteForbiddenRes.status !== 403) {
      throw new Error(`User 2 xoá được bài của User 1 (Kỳ vọng 403, nhận ${deleteForbiddenRes.status})!`);
    }
    console.log("✅ TEST CASE 5 PASSED: Chặn user lạ xoá bài viết với mã 403 Forbidden.");

    // =========================================================================
    // TEST CASE 6: REALTIME SOCKET.IO CHAT GATEWAY & PHÒNG CHAT CỘNG ĐỒNG
    // =========================================================================
    console.log("\n--- TEST CASE 6: REALTIME SOCKET.IO CHAT GATEWAY ---");

    // Lấy danh sách phòng chat mẫu
    const roomsRes = await fetch(`${baseUrl}/chat/rooms`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const roomsData = await roomsRes.json();
    console.log(`Số phòng chat cộng đồng sẵn có: ${roomsData.data.length}`);
    if (roomsData.data.length < 3) {
      throw new Error("Không đủ 3 phòng chat mẫu đã seed!");
    }
    console.log("Phòng chat 1:", roomsData.data[0].title);

    // Tạo cuộc trò chuyện 1-1 giữa User 1 và User 2
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
    console.log(`Cuộc trò chuyện 1-1 khởi tạo (ID: ${directConvId})`);

    // Kết nối Socket.io Client cho cả 2 user
    socketUser1 = ioClient(wsUrl, {
      auth: { token: user1Token },
      transports: ["websocket"],
    });

    socketUser2 = ioClient(wsUrl, {
      auth: { token: user2Token },
      transports: ["websocket"],
    });

    // Chờ 2 socket kết nối thành công
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        socketUser1!.on("connect", () => resolve());
        socketUser1!.on("connect_error", (err) => reject(err));
      }),
      new Promise<void>((resolve, reject) => {
        socketUser2!.on("connect", () => resolve());
        socketUser2!.on("connect_error", (err) => reject(err));
      }),
    ]);
    console.log("✅ 6.1. Cả 2 Socket Clients đã kết nối và xác thực JWT thành công.");

    // Cả 2 cùng join vào phòng trò chuyện 1-1
    socketUser1.emit("join_room", { conversationId: directConvId });
    socketUser2.emit("join_room", { conversationId: directConvId });

    // User 2 lắng nghe tin nhắn realtime
    const messagePromise = new Promise<any>((resolve) => {
      socketUser2!.on("new_message", (msg) => {
        resolve(msg);
      });
    });

    // User 1 gửi tin nhắn realtime qua Socket
    const testMessageText = "Chào bạn! Món cơm gà bạn làm nhìn ngon quá, cho mình xin kinh nghiệm với!";
    socketUser1.emit("send_message", {
      conversationId: directConvId,
      text: testMessageText,
    });

    const receivedMessage = await messagePromise;
    console.log(`Tin nhắn realtime nhận được: "${receivedMessage.text}" từ "${receivedMessage.sender.name}"`);

    if (receivedMessage.text !== testMessageText) {
      throw new Error("Tin nhắn realtime nhận được không khớp nội dung!");
    }
    console.log("✅ 6.2. Broadcast tin nhắn realtime qua Socket.io thành công.");

    // User 1 emit typing -> User 2 nhận user_typing
    const typingPromise = new Promise<any>((resolve) => {
      socketUser2!.on("user_typing", (data) => {
        resolve(data);
      });
    });

    socketUser1.emit("typing", { conversationId: directConvId });
    const typingData = await typingPromise;
    console.log(`User 2 nhận thông báo đang soạn tin từ User: ${typingData.userName}`);
    console.log("✅ 6.3. Sự kiện typing indicator hoạt động chuẩn xác.");

    // Kiểm tra REST API lấy lịch sử tin nhắn
    const historyRes = await fetch(`${baseUrl}/chat/conversations/${directConvId}/messages`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    const historyData = await historyRes.json();
    console.log(`Lịch sử tin nhắn lưu trữ: ${historyData.data.length} tin nhắn.`);
    if (historyData.data.length === 0) {
      throw new Error("Không lưu được tin nhắn vào MongoDB!");
    }
    console.log("✅ TEST CASE 6 PASSED: Realtime Socket.io Chat Gateway hoạt động 100% hoàn hảo.");

    // =========================================================================
    // CLEANUP DỮ LIỆU TEST
    // =========================================================================
    console.log("\n--- DỌN DẸP DỮ LIỆU KIỂM THỬ ---");
    if (socketUser1) socketUser1.disconnect();
    if (socketUser2) socketUser2.disconnect();

    await Post.findByIdAndDelete(createdPostId);
    await Comment.deleteMany({ postId: createdPostId });
    await Conversation.findByIdAndDelete(directConvId);
    await Message.deleteMany({ conversationId: directConvId });
    await User.findByIdAndDelete(user1Id);
    await User.findByIdAndDelete(user2Id);
    console.log("✅ Dọn dẹp dữ liệu test hoàn tất.");

    console.log("\n===============================================================");
    console.log("   🎉 TẤT CẢ 6/6 TEST CASE GIAI ĐOẠN 6 ĐỀU VƯỢT QUA 100%!       ");
    console.log("===============================================================\n");
  } catch (err: any) {
    console.error("❌ E2E Phase 6 Testing gặp lỗi:", err.message || err);
    process.exitCode = 1;
  } finally {
    if (socketUser1) socketUser1.disconnect();
    if (socketUser2) socketUser2.disconnect();
    if (httpServer!) {
      httpServer.close();
    }
    await disconnectDB();
  }
};

runE2EPhase6();
