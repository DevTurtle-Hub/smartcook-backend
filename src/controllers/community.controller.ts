import { Request, Response } from "express";
import { communityService } from "../services/community.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/response";

export class CommunityController {
  /**
   * GET /api/v1/posts or /api/v1/community/posts
   */
  getPosts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const tag = req.query.tag as string | undefined;
    const search = req.query.search as string | undefined;
    const authorId = req.query.authorId as string | undefined;

    const currentUserId = (req.user as any)?._id?.toString();

    const result = await communityService.getPosts(
      { tag, search, authorId },
      page,
      limit,
      currentUserId
    );

    ApiResponse.success(res, result, "Lấy danh sách bài đăng cộng đồng thành công");
  });

  /**
   * GET /api/v1/posts/:id
   */
  getPostById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const currentUserId = (req.user as any)?._id?.toString();

    const post = await communityService.getPostById(id, currentUserId);
    ApiResponse.success(res, post, "Lấy chi tiết bài đăng thành công");
  });

  /**
   * POST /api/v1/posts
   */
  createPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!._id.toString();
    const files = req.files as Express.Multer.File[] | undefined;

    const post = await communityService.createPost(userId, req.body, files);
    ApiResponse.created(
      res,
      post,
      "Đăng bài viết cộng đồng thành công! Bạn nhận được +20 XP Đầu Bếp."
    );
  });

  /**
   * POST /api/v1/posts/:id/react
   */
  reactPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const userId = req.user!._id.toString();
    const type = req.body.type || "like";

    const post = await communityService.reactPost(id, userId, type);
    ApiResponse.success(res, post, "Cập nhật cảm xúc thành công");
  });

  /**
   * POST /api/v1/posts/:id/like (Mobile alias)
   */
  likePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const userId = req.user!._id.toString();

    const post = await communityService.reactPost(id, userId, "like");
    ApiResponse.success(res, post, "Thả tim bài viết thành công");
  });

  /**
   * POST /api/v1/posts/:id/comments
   */
  addComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const userId = req.user!._id.toString();
    const { content, parentComment, parentCommentId } = req.body;

    const comment = await communityService.addComment(
      id,
      userId,
      content,
      parentComment || parentCommentId
    );

    ApiResponse.created(
      res,
      comment,
      "Thêm bình luận thành công! Bạn nhận được +5 XP."
    );
  });

  /**
   * GET /api/v1/posts/:id/comments
   */
  getComments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const result = await communityService.getComments(id, page, limit);
    ApiResponse.success(res, result, "Lấy danh sách bình luận thành công");
  });

  /**
   * DELETE /api/v1/posts/:id
   */
  deletePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const userId = req.user!._id.toString();
    const userRole = (req.user as any)?.role || "user";

    await communityService.deletePost(id, userId, userRole);
    ApiResponse.success(res, null, "Xoá bài viết thành công");
  });

  /**
   * PATCH /api/v1/posts/:id/pin (Admin only)
   */
  togglePin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const userRole = (req.user as any)?.role || "user";

    const post = await communityService.togglePin(id, userRole);
    ApiResponse.success(res, post, "Cập nhật trạng thái ghim bài viết thành công");
  });

  /**
   * PATCH /api/v1/posts/:id/status (Admin only)
   */
  updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const { status } = req.body;
    const userRole = (req.user as any)?.role || "user";

    const post = await communityService.updateStatus(id, status, userRole);
    ApiResponse.success(res, post, "Cập nhật trạng thái kiểm duyệt thành công");
  });
}

export const communityController = new CommunityController();
export default communityController;
