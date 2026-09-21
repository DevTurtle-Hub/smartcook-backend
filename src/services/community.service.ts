import { Types } from "mongoose";
import { uploadToCloudinary } from "../config/cloudinary";
import Comment, { IComment } from "../models/Comment";
import Post, { IPost, IPostImage, ReactionType } from "../models/Post";
import User from "../models/User";
import { communityRepository, PostFilter } from "../repositories/community.repository";
import { userRepository } from "../repositories/user.repository";
import { BadRequestError, ForbiddenError, NotFoundError } from "../utils/errors";
import { calculateChefLevel } from "./cookingHistory.service";

export interface CreatePostInput {
  dishName?: string;
  caption?: string;
  content?: string;
  recipeId?: string;
  tags?: string[] | string;
  images?: Array<{ url: string; publicId?: string }> | string[];
}

export class CommunityService {
  /**
   * Helper to enrich Post with user context (isLiked, myReaction, image strings)
   */
  private enrichPostDTO(post: any, currentUserId?: string) {
    const json = typeof post.toJSON === "function" ? post.toJSON() : { ...post };
    const idStr = json._id ? json._id.toString() : json.id;
    json.id = idStr;
    json._id = idStr;

    // Mobile aliases
    json.content = json.caption;
    json.likesCount = json.totalReactions || 0;

    // Flatten image URLs for mobile
    json.imageUrls = (json.images || []).map((img: any) =>
      typeof img === "string" ? img : img.url
    );

    // If current user is provided, check reaction
    if (currentUserId && post.reactions) {
      json.isLiked = post.reactions.has(currentUserId);
      json.myReaction = post.reactions.get(currentUserId) || null;
    } else {
      json.isLiked = false;
      json.myReaction = null;
    }

    return json;
  }

  /**
   * Get list of community posts with pagination and filter
   */
  async getPosts(
    filter: PostFilter = {},
    page = 1,
    limit = 20,
    currentUserId?: string
  ) {
    const result = await communityRepository.findPosts(filter, page, limit);
    return {
      posts: result.posts.map((p) => this.enrichPostDTO(p, currentUserId)),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };
  }

  /**
   * Get post by ID
   */
  async getPostById(postId: string, currentUserId?: string) {
    const post = await communityRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Bài viết không tồn tại hoặc đã bị xoá");
    }
    return this.enrichPostDTO(post, currentUserId);
  }

  /**
   * Create a community post with multiple image uploads
   */
  async createPost(
    userId: string,
    input: CreatePostInput,
    files?: Express.Multer.File[]
  ) {
    const captionText = input.caption || input.content;
    if (!captionText || !captionText.trim()) {
      throw new BadRequestError("Nội dung bài viết (caption/content) không được để trống");
    }

    const uploadedImages: IPostImage[] = [];

    // 1. Process files if uploaded via multipart/form-data
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const res = await uploadToCloudinary(file.buffer, "smartcook/community");
          uploadedImages.push({ url: res.url, publicId: res.publicId });
        } catch (err: any) {
          console.warn("⚠️ [CommunityService] Upload image failed, using fallback:", err?.message || err);
          uploadedImages.push({
            url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
          });
        }
      }
    }

    // 2. Also process direct image URLs if sent via JSON
    if (input.images && Array.isArray(input.images) && input.images.length > 0) {
      for (const img of input.images) {
        if (typeof img === "string" && img.trim()) {
          uploadedImages.push({ url: img.trim() });
        } else if (typeof img === "object" && img?.url) {
          uploadedImages.push({ url: img.url, publicId: img.publicId });
        }
      }
    }

    // 3. Normalize tags
    let tagsList: string[] = [];
    if (Array.isArray(input.tags)) {
      tagsList = input.tags.map((t) => (t.startsWith("#") ? t : `#${t}`.trim()));
    } else if (typeof input.tags === "string" && input.tags.trim()) {
      tagsList = input.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith("#") ? t : `#${t}`));
    }

    const postData: Partial<IPost> = {
      author: new Types.ObjectId(userId) as any,
      dishName: input.dishName?.trim() || "Món ngon tự nấu",
      caption: captionText.trim(),
      images: uploadedImages,
      tags: tagsList,
      recipeId: input.recipeId && Types.ObjectId.isValid(input.recipeId) ? (new Types.ObjectId(input.recipeId) as any) : undefined,
    };

    const post = await communityRepository.createPost(postData);

    // Gamification: Award +20 XP for sharing a recipe / post
    await User.findByIdAndUpdate(userId, {
      $inc: { chefExp: 20 },
    }).exec();
    const updatedUser = await userRepository.findById(userId);
    if (updatedUser) {
      const newLevel = calculateChefLevel(updatedUser.chefExp);
      if (newLevel !== updatedUser.level) {
        updatedUser.level = newLevel;
        await updatedUser.save();
      }
    }

    return this.enrichPostDTO(post, userId);
  }

  /**
   * Toggle reaction / like
   */
  async reactPost(postId: string, userId: string, type: ReactionType = "like") {
    const post = await communityRepository.toggleReaction(postId, userId, type);
    if (!post) {
      throw new NotFoundError("Bài viết không tồn tại");
    }
    return this.enrichPostDTO(post, userId);
  }

  /**
   * Add a comment to a post
   */
  async addComment(
    postId: string,
    userId: string,
    content: string,
    parentCommentId?: string
  ) {
    if (!content || !content.trim()) {
      throw new BadRequestError("Nội dung bình luận không được để trống");
    }

    const post = await communityRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Bài viết không tồn tại");
    }

    const comment = await communityRepository.createComment({
      postId: new Types.ObjectId(postId) as any,
      author: new Types.ObjectId(userId) as any,
      content: content.trim(),
      parentCommentId: parentCommentId && Types.ObjectId.isValid(parentCommentId) ? (new Types.ObjectId(parentCommentId) as any) : undefined,
    });

    // Gamification: Award +5 XP for engaging with the community
    await User.findByIdAndUpdate(userId, {
      $inc: { chefExp: 5 },
    }).exec();

    return comment;
  }

  /**
   * Get comments of a post
   */
  async getComments(postId: string, page = 1, limit = 50) {
    const post = await communityRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Bài viết không tồn tại");
    }
    return await communityRepository.findCommentsByPostId(postId, page, limit);
  }

  /**
   * Delete post (owner or admin)
   */
  async deletePost(postId: string, userId: string, userRole: string = "user") {
    const post = await communityRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Bài viết không tồn tại");
    }

    const isAuthor = post.author._id.toString() === userId;
    const isAdmin = userRole === "admin";

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenError("Bạn không có quyền xoá bài viết này");
    }

    return await communityRepository.deletePost(postId);
  }
}

export const communityService = new CommunityService();
export default communityService;
