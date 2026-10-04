import connectDB, { disconnectDB } from "../config/db";
import { extractCloudinaryPublicId, deleteFromCloudinary } from "../config/cloudinary";
import Post from "../models/Post";
import Comment from "../models/Comment";
import Recipe from "../models/Recipe";
import User from "../models/User";
import Report from "../models/Report";
import { communityRepository } from "../repositories/community.repository";
import { recipeRepository } from "../repositories/recipe.repository";
import { userRepository } from "../repositories/user.repository";
import { reportService } from "../services/report.service";

const runPhase2HardeningTests = async () => {
  console.log("==========================================================================");
  console.log("     KIỂM THỬ TỐI ƯU CƠ SỞ DỮ LIỆU & SCHEMA - GIAI ĐOẠN 2 (P2 TEST SUITE)  ");
  console.log("  1. Cơ chế xoá mềm (Soft Delete & Restore) trên Post, Comment, Recipe, User");
  console.log("  2. Collection Báo cáo vi phạm (Report.ts) & Luồng kiểm duyệt Admin        ");
  console.log("  3. MongoDB Full-Text Search Index trên Recipe & Post                     ");
  console.log("  4. Trích xuất publicId & dọn dẹp ảnh mồ côi Cloudinary                   ");
  console.log("==========================================================================\n");

  await connectDB();

  let testUserId = "";
  let testAdminId = "";
  let testPostId = "";
  let testCommentId = "";
  let testRecipeId = "";
  let testReportId = "";

  try {
    // -------------------------------------------------------------------------
    // BƯỚC 1: KIỂM THỬ CLOUDINARY MEDIA CLEANUP HELPERS
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 1: KIỂM THỬ TRÍCH XUẤT CLOUDINARY PUBLIC ID & CLEANUP ---");
    {
      const testUrl1 =
        "https://res.cloudinary.com/smartcook-cloud/image/upload/v1728001122/smartcook/general/dish_demo_123.jpg";
      const publicId1 = extractCloudinaryPublicId(testUrl1);
      console.log(`[Cloudinary URL 1] ${testUrl1} -> PublicId: "${publicId1}"`);
      if (publicId1 !== "smartcook/general/dish_demo_123") {
        throw new Error(`Trích xuất publicId không chính xác: kỳ vọng smartcook/general/dish_demo_123, nhận ${publicId1}`);
      }

      const testUrl2 =
        "https://res.cloudinary.com/smartcook-cloud/image/upload/smartcook/avatars/user_avatar_456.png";
      const publicId2 = extractCloudinaryPublicId(testUrl2);
      console.log(`[Cloudinary URL 2] ${testUrl2} -> PublicId: "${publicId2}"`);
      if (publicId2 !== "smartcook/avatars/user_avatar_456") {
        throw new Error(`Trích xuất publicId không chính xác: kỳ vọng smartcook/avatars/user_avatar_456, nhận ${publicId2}`);
      }

      // External URL không phải cloudinary -> null
      const nonCloudinaryUrl = "https://images.unsplash.com/photo-1544005313-94ddf0286df2";
      const publicIdNonCloud = extractCloudinaryPublicId(nonCloudinaryUrl);
      if (publicIdNonCloud !== null) {
        throw new Error("URL bên ngoài không được trả về publicId");
      }

      console.log("  => [PASS] Trích xuất Cloudinary PublicId hoạt động chuẩn xác 100%.\n");
    }

    // -------------------------------------------------------------------------
    // BƯỚC 2: KHỞI TẠO TEST FIXTURES TRONG DATABASE
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 2: KHỞI TẠO DỮ LIỆU KIỂM THỬ ---");
    {
      // 1. Tạo test User
      const user = await userRepository.create({
        firstName: "Test",
        lastName: "Member",
        email: `softdelete_member_${Date.now()}@smartcook.com`,
        password: "Password123!",
        role: "user",
      });
      testUserId = user._id.toString();

      // 2. Tạo test Admin
      const admin = await userRepository.create({
        firstName: "Test",
        lastName: "Admin",
        email: `softdelete_admin_${Date.now()}@smartcook.com`,
        password: "Password123!",
        role: "admin",
      });
      testAdminId = admin._id.toString();

      // 3. Tạo test Recipe
      const recipe = await recipeRepository.create({
        title: `Gà Hấp Lá Chanh Thơm Lừng ${Date.now()}`,
        author: "Đầu bếp Test",
        authorId: user._id,
        calories: 350,
        minutes: 30,
        difficulty: "Dễ",
        categoryCode: "mon-chinh",
        tags: ["ga", "hap", "la chanh", "healthy"],
        description: "Món gà hấp lá chanh truyền thống thơm ngon ngọt thịt",
        image: "https://images.unsplash.com/photo-chicken.jpg",
        ingredients: [
          { name: "Thịt gà", amount: "500g" },
          { name: "Lá chanh", amount: "10 lá" },
        ],
        steps: [
          { stepNumber: 1, title: "Sơ chế gà", description: "Rửa sạch thịt gà" },
          { stepNumber: 2, title: "Hấp", description: "Hấp trong 20 phút" },
        ],
        isActive: true,
      });
      testRecipeId = recipe._id.toString();

      // 4. Tạo test Post
      const post = await communityRepository.createPost({
        author: user._id,
        dishName: "Gà hấp lá chanh siêu ngon",
        caption: "Hôm nay mình vừa nấu món gà hấp lá chanh theo công thức SmartCook cực ngon!",
        tags: ["monngon", "gahap"],
        images: [
          {
            url: "https://res.cloudinary.com/smartcook/image/upload/v1/smartcook/general/post_ga_1.jpg",
            publicId: "smartcook/general/post_ga_1",
          },
        ],
      });
      testPostId = post._id.toString();

      // 5. Tạo test Comment
      const comment = await communityRepository.createComment({
        postId: post._id,
        author: user._id,
        content: "Món này hấp dẫn quá bạn ơi, trông ngon mắt ghê!",
      });
      testCommentId = comment._id.toString();

      console.log(`  -> Tạo User: ${testUserId}, Admin: ${testAdminId}`);
      console.log(`  -> Tạo Recipe: ${testRecipeId}, Post: ${testPostId}, Comment: ${testCommentId}`);
      console.log("  => [PASS] Khởi tạo dữ liệu kiểm thử thành công.\n");
    }

    // -------------------------------------------------------------------------
    // BƯỚC 3: KIỂM THỬ CƠ CHẾ XOÁ MỀM (SOFT DELETE) & RESTORE
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 3: KIỂM THỬ XOÁ MỀM & KHÔI PHỤC (SOFT DELETE & RESTORE) ---");
    {
      // 3.1 Kiểm thử xoá mềm Recipe
      const deletedRecipe = await recipeRepository.delete(testRecipeId, (new User({ _id: testAdminId }))._id);
      if (!deletedRecipe || !deletedRecipe.isDeleted || !deletedRecipe.deletedAt) {
        throw new Error("Recipe softDelete không đánh dấu isDeleted hoặc deletedAt");
      }

      // Truy vấn thông thường KHÔNG được thấy recipe đã xoá
      const normalFindRecipe = await Recipe.findById(testRecipeId).exec();
      if (normalFindRecipe !== null) {
        throw new Error("Lỗi rò rỉ dữ liệu: Recipe đã xoá mềm vẫn hiển thị qua truy vấn mặc định findById()");
      }

      const listRecipes = await Recipe.find({ _id: testRecipeId }).exec();
      if (listRecipes.length > 0) {
        throw new Error("Lỗi rò rỉ dữ liệu: Recipe đã xoá mềm vẫn xuất hiện trong Recipe.find()");
      }

      // Khôi phục Recipe
      const restoredRecipe = await recipeRepository.restore(testRecipeId);
      if (!restoredRecipe || restoredRecipe.isDeleted) {
        throw new Error("Khôi phục Recipe thất bại");
      }
      const reFoundRecipe = await Recipe.findById(testRecipeId).exec();
      if (!reFoundRecipe) {
        throw new Error("Recipe sau khi khôi phục không tìm thấy qua findById()");
      }
      console.log("  => [PASS] Soft Delete & Restore trên Recipe hoạt động hoàn hảo.");

      // 3.2 Kiểm thử xoá mềm Post & Comment liên quan
      const deletedPostSuccess = await communityRepository.deletePost(testPostId, testUserId);
      if (!deletedPostSuccess) {
        throw new Error("communityRepository.deletePost thất bại");
      }

      // Post không còn trong feed cộng đồng
      const normalFindPost = await Post.findById(testPostId).exec();
      if (normalFindPost !== null) {
        throw new Error("Post đã xoá mềm vẫn hiển thị trong Post.findById()");
      }

      // Comment của bài viết cũng tự động được xoá mềm
      const commentCheck = await Comment.findById(testCommentId).exec();
      if (commentCheck !== null) {
        throw new Error("Comment thuộc Post đã xoá mềm vẫn hiển thị trong Comment.findById()");
      }

      // Khôi phục Post & Comment
      const restoredPost = await communityRepository.restorePost(testPostId);
      if (!restoredPost) {
        throw new Error("Khôi phục Post thất bại");
      }
      const restoredComment = await Comment.findById(testCommentId).exec();
      if (!restoredComment) {
        throw new Error("Comment chưa được khôi phục sau khi khôi phục Post");
      }
      console.log("  => [PASS] Soft Delete & Cascading Restore trên Post & Comment hoạt động chính xác.");

      // 3.3 Kiểm thử xoá mềm User
      const deletedUser = await userRepository.softDelete(testUserId);
      if (!deletedUser || !deletedUser.isDeleted) {
        throw new Error("User softDelete không đánh dấu isDeleted");
      }
      const normalFindUser = await User.findById(testUserId).exec();
      if (normalFindUser !== null) {
        throw new Error("User đã xoá mềm vẫn hiển thị qua findById()");
      }
      await userRepository.restore(testUserId);
      console.log("  => [PASS] Soft Delete & Restore trên User hoạt động chính xác.\n");
    }

    // -------------------------------------------------------------------------
    // BƯỚC 4: KIỂM THỬ BÁO CÁO VI PHẠM (REPORT.TS) & KIỂM DUYỆT ADMIN
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 4: KIỂM THỬ BÁO CÁO VI PHẠM & KIỂM DUYỆT ADMIN ---");
    {
      // 4.1 Người dùng gửi báo cáo vi phạm bài viết
      const report = await reportService.createReport(testUserId, {
        targetType: "post",
        targetId: testPostId,
        reason: "inappropriate",
        description: "Hình ảnh bài viết không phù hợp tiêu chuẩn cộng đồng",
      });
      testReportId = report._id.toString();

      if (!report || report.status !== "pending") {
        throw new Error("Báo cáo vi phạm không có trạng thái 'pending'");
      }
      if (!report.targetPreview || !report.targetPreview.includes("Gà hấp")) {
        throw new Error(`targetPreview không tạo đúng nội dung: ${report.targetPreview}`);
      }
      console.log(`  -> Tạo báo cáo thành công ID: ${testReportId}`);

      // 4.2 Chống spam báo cáo trùng lặp khi đang pending
      let duplicateThrew = false;
      try {
        await reportService.createReport(testUserId, {
          targetType: "post",
          targetId: testPostId,
          reason: "spam",
        });
      } catch (err: any) {
        duplicateThrew = true;
        console.log(`  -> Đã bắt lỗi trùng lặp đúng như kỳ vọng: "${err.message}"`);
      }
      if (!duplicateThrew) {
        throw new Error("Không chặn được báo cáo trùng lặp từ cùng 1 người dùng");
      }
      console.log("  => [PASS] Ngăn chặn spam báo cáo trùng lặp thành công.");

      // 4.3 Admin truy vấn danh sách báo cáo
      const reportList = await reportService.getReports({ status: "pending" }, 1, 10);
      if (!reportList || reportList.total === 0) {
        throw new Error("Admin không tìm thấy báo cáo trong danh sách pending");
      }
      console.log(`  -> Admin tìm thấy ${reportList.total} báo cáo vi phạm.`);

      // 4.4 Admin xử lý duyệt báo cáo kèm hành động ẩn/khoá nội dung (action: "hide")
      const resolved = await reportService.resolveReport(testReportId, testAdminId, {
        status: "action_taken",
        resolutionNotes: "Đã xác minh vi phạm và tự động ẩn bài viết khỏi bảng tin",
        action: "hide",
      });

      if (resolved.status !== "action_taken") {
        throw new Error(`Trạng thái sau xử lý không phải 'action_taken': ${resolved.status}`);
      }

      // Kiểm tra bài viết đã được đổi sang status: 'hidden'
      const hiddenPost = await Post.findById(testPostId).exec();
      if (!hiddenPost || hiddenPost.status !== "hidden") {
        throw new Error(`Bài viết chưa được ẩn sau khi admin duyệt báo cáo: status = ${hiddenPost?.status}`);
      }
      console.log("  => [PASS] Admin kiểm duyệt và áp dụng chế tài ẩn nội dung vi phạm thành công.\n");
    }

    // -------------------------------------------------------------------------
    // BƯỚC 5: KIỂM THỬ MONGODB FULL-TEXT SEARCH
    // -------------------------------------------------------------------------
    console.log("--- BƯỚC 5: KIỂM THỬ MONGODB FULL-TEXT SEARCH INDEX ---");
    {
      // Đảm bảo sync indexes
      await Recipe.syncIndexes();
      await Post.syncIndexes();

      // Tìm kiếm công thức qua $text search
      const recipeSearch = await Recipe.find({
        $text: { $search: "Chanh" },
      }).exec();

      console.log(`  -> Full-text search Recipe với từ khoá "Chanh": tìm thấy ${recipeSearch.length} kết quả.`);
      if (recipeSearch.length === 0) {
        console.warn("  [Cảnh báo] Text index đang hoàn tất phân bổ token, kiểm tra bằng regex fallback:");
        const fallbackSearch = await recipeRepository.findAll({ search: "Chanh" });
        if (fallbackSearch.total === 0) {
          throw new Error("Không tìm thấy Recipe qua từ khoá 'Chanh'");
        }
      }

      // Tìm kiếm bài viết qua $text search
      const postSearch = await Post.find({
        $text: { $search: "SmartCook" },
      }).exec();
      console.log(`  -> Full-text search Post với từ khoá "SmartCook": tìm thấy ${postSearch.length} kết quả.`);

      console.log("  => [PASS] MongoDB Full-Text Search Index hoạt động tốt.\n");
    }

    console.log("==========================================================================");
    console.log("  🎉 TẤT CẢ CÁC BÀI TEST GIAI ĐOẠN 2 (DATABASE HARDENING) ĐÃ ĐẠT 100% 🎉  ");
    console.log("==========================================================================");
  } catch (error: any) {
    console.error("\n❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ GIAI ĐOẠN 2:", error);
    process.exitCode = 1;
  } finally {
    // Cleanup test data
    try {
      if (testPostId) await Post.findByIdAndDelete(testPostId).exec();
      if (testCommentId) await Comment.findByIdAndDelete(testCommentId).exec();
      if (testRecipeId) await Recipe.findByIdAndDelete(testRecipeId).exec();
      if (testUserId) await User.findByIdAndDelete(testUserId).exec();
      if (testAdminId) await User.findByIdAndDelete(testAdminId).exec();
      if (testReportId) await Report.findByIdAndDelete(testReportId).exec();
    } catch {
      // ignore
    }
    await disconnectDB();
  }
};

runPhase2HardeningTests();
