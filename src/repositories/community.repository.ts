import { Types } from "mongoose";
import Comment, { IComment } from "../models/Comment";
import Post, { IPost, ReactionType } from "../models/Post";

export interface PostFilter {
  tag?: string;
  authorId?: string;
  search?: string;
}

export interface PaginatedPostsResult {
  posts: IPost[];
  total: number;
  page?: number;
  totalPages?: number;
  nextCursor: string | null;
  hasNextPage: boolean;
}

export class CommunityRepository {
  /**
   * Create a new community post
   */
  async createPost(data: Partial<IPost>): Promise<IPost> {
    const post = new Post(data);
    await post.save();
    return await post.populate("author", "firstName lastName fullName avatar level role");
  }

  /**
   * Find paginated posts (supports both cursor-based and offset-based pagination)
   */
  async findPosts(
    filter: PostFilter = {},
    page = 1,
    limit = 20,
    cursor?: string
  ): Promise<PaginatedPostsResult> {
    const query: Record<string, any> = {};

    if (filter.tag) {
      query.tags = { $in: [filter.tag] };
    }

    if (filter.authorId && Types.ObjectId.isValid(filter.authorId)) {
      query.author = new Types.ObjectId(filter.authorId);
    }

    if (filter.search) {
      query.$or = [
        { $text: { $search: filter.search } },
        { caption: { $regex: filter.search, $options: "i" } },
        { dishName: { $regex: filter.search, $options: "i" } },
      ];
    }

    // Cursor-based query branch
    if (cursor && Types.ObjectId.isValid(cursor)) {
      const cursorQuery = { ...query, _id: { $lt: new Types.ObjectId(cursor) } };

      const [rawPosts, total] = await Promise.all([
        Post.find(cursorQuery)
          .populate("author", "firstName lastName fullName avatar level role")
          .populate("recipeId", "title image")
          .sort({ _id: -1 })
          .limit(limit + 1)
          .exec(),
        Post.countDocuments(query).exec(),
      ]);

      const hasNextPage = rawPosts.length > limit;
      const posts = hasNextPage ? rawPosts.slice(0, limit) : rawPosts;
      const nextCursor =
        hasNextPage && posts.length > 0 ? posts[posts.length - 1]._id.toString() : null;

      return {
        posts,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        nextCursor,
        hasNextPage,
      };
    }

    // Offset-based query branch (page, limit)
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate("author", "firstName lastName fullName avatar level role")
        .populate("recipeId", "title image")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Post.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const hasNextPage = page < totalPages;
    const nextCursor =
      hasNextPage && posts.length > 0 ? posts[posts.length - 1]._id.toString() : null;

    return {
      posts,
      total,
      page,
      totalPages,
      nextCursor,
      hasNextPage,
    };
  }

  /**
   * Find post by ID
   */
  async findById(id: string): Promise<IPost | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await Post.findById(id)
      .populate("author", "firstName lastName fullName avatar level role")
      .populate("recipeId", "title image")
      .exec();
  }

  /**
   * Soft delete post by ID
   */
  async deletePost(id: string, deletedBy?: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const post = await Post.findById(id).exec();
    if (post) {
      const deleterId = deletedBy && Types.ObjectId.isValid(deletedBy) ? new Types.ObjectId(deletedBy) : undefined;
      await post.softDelete(deleterId);
      // Also soft delete associated comments
      await Comment.updateMany(
        { postId: post._id },
        { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: deleterId } }
      ).exec();
      return true;
    }
    return false;
  }

  /**
   * Restore soft-deleted post
   */
  async restorePost(id: string): Promise<IPost | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const post = await Post.findOne({ _id: id, isDeleted: true }).exec();
    if (post) {
      await post.restore();
      // Restore associated comments
      await Comment.updateMany(
        { postId: post._id, isDeleted: true },
        { $set: { isDeleted: false, deletedAt: null, deletedBy: null } }
      ).exec();
      return post;
    }
    return null;
  }

  /**
   * Toggle reaction / like on a post
   */
  async toggleReaction(
    postId: string,
    userId: string,
    reactionType: ReactionType = "like"
  ): Promise<IPost | null> {
    const post = await this.findById(postId);
    if (!post) return null;

    const existingReaction = post.reactions.get(userId);

    // If already has same reaction, remove it (unlike)
    if (existingReaction === reactionType) {
      post.reactions.delete(userId);
      if (post.reactionCounts[reactionType] > 0) {
        post.reactionCounts[reactionType]--;
      }
      post.totalReactions = Math.max(0, post.totalReactions - 1);
    } else {
      // If changing from another reaction
      if (existingReaction && post.reactionCounts[existingReaction] > 0) {
        post.reactionCounts[existingReaction]--;
      } else {
        post.totalReactions++;
      }
      post.reactions.set(userId, reactionType);
      post.reactionCounts[reactionType] = (post.reactionCounts[reactionType] || 0) + 1;
    }

    await post.save();
    return post;
  }

  /**
   * Create a comment on a post
   */
  async createComment(data: Partial<IComment>): Promise<IComment> {
    const comment = new Comment(data);
    await comment.save();

    // Increment commentsCount on Post
    await Post.findByIdAndUpdate(data.postId, {
      $inc: { commentsCount: 1 },
    }).exec();

    return await comment.populate("author", "firstName lastName fullName avatar level role");
  }

  /**
   * Find comments by post ID
   */
  async findCommentsByPostId(
    postId: string,
    page = 1,
    limit = 50
  ): Promise<{ comments: IComment[]; total: number }> {
    if (!Types.ObjectId.isValid(postId)) return { comments: [], total: 0 };

    const query = { postId: new Types.ObjectId(postId) };
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .populate("author", "firstName lastName fullName avatar level role")
        .sort({ createdAt: 1 }) // Chronological for chat-like comment thread
        .skip(skip)
        .limit(limit)
        .exec(),
      Comment.countDocuments(query).exec(),
    ]);

    return { comments, total };
  }

  /**
   * Soft delete comment by ID
   */
  async deleteComment(commentId: string, deletedBy?: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(commentId)) return false;
    const comment = await Comment.findById(commentId).exec();
    if (comment) {
      const deleterId = deletedBy && Types.ObjectId.isValid(deletedBy) ? new Types.ObjectId(deletedBy) : undefined;
      await comment.softDelete(deleterId);
      await Post.findByIdAndUpdate(comment.postId, {
        $inc: { commentsCount: -1 },
      }).exec();
      return true;
    }
    return false;
  }

  /**
   * Restore soft-deleted comment
   */
  async restoreComment(commentId: string): Promise<IComment | null> {
    if (!Types.ObjectId.isValid(commentId)) return null;
    const comment = await Comment.findOne({ _id: commentId, isDeleted: true }).exec();
    if (comment) {
      await comment.restore();
      await Post.findByIdAndUpdate(comment.postId, {
        $inc: { commentsCount: 1 },
      }).exec();
      return comment;
    }
    return null;
  }
}

export const communityRepository = new CommunityRepository();
export default communityRepository;
