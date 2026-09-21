import { Types } from "mongoose";
import Comment, { IComment } from "../models/Comment";
import Post, { IPost, ReactionType } from "../models/Post";

export interface PostFilter {
  tag?: string;
  authorId?: string;
  search?: string;
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
   * Find paginated posts
   */
  async findPosts(
    filter: PostFilter = {},
    page = 1,
    limit = 20
  ): Promise<{ posts: IPost[]; total: number; page: number; totalPages: number }> {
    const query: Record<string, any> = {};

    if (filter.tag) {
      query.tags = { $in: [filter.tag] };
    }

    if (filter.authorId && Types.ObjectId.isValid(filter.authorId)) {
      query.author = new Types.ObjectId(filter.authorId);
    }

    if (filter.search) {
      query.$or = [
        { caption: { $regex: filter.search, $options: "i" } },
        { dishName: { $regex: filter.search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate("author", "firstName lastName fullName avatar level role")
        .populate("recipeId", "title image")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      Post.countDocuments(query).exec(),
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
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
   * Delete post by ID
   */
  async deletePost(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const post = await Post.findByIdAndDelete(id).exec();
    if (post) {
      // Also delete associated comments
      await Comment.deleteMany({ postId: post._id }).exec();
      return true;
    }
    return false;
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
   * Delete comment by ID
   */
  async deleteComment(commentId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(commentId)) return false;
    const comment = await Comment.findByIdAndDelete(commentId).exec();
    if (comment) {
      await Post.findByIdAndUpdate(comment.postId, {
        $inc: { commentsCount: -1 },
      }).exec();
      return true;
    }
    return false;
  }
}

export const communityRepository = new CommunityRepository();
export default communityRepository;
