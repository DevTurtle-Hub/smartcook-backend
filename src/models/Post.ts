import mongoose, { Document, Model, Schema } from "mongoose";

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export interface IPostImage {
  url: string;
  publicId?: string;
}

export interface IPostReactionCounts {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
}

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  dishName: string;
  caption: string;
  images: IPostImage[];
  recipeId?: mongoose.Types.ObjectId;
  tags: string[];
  reactions: Map<string, ReactionType>;
  reactionCounts: IPostReactionCounts;
  totalReactions: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostImageSchema = new Schema<IPostImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
  },
  { _id: false }
);

const PostReactionCountsSchema = new Schema<IPostReactionCounts>(
  {
    like: { type: Number, default: 0 },
    love: { type: Number, default: 0 },
    haha: { type: Number, default: 0 },
    wow: { type: Number, default: 0 },
    sad: { type: Number, default: 0 },
    angry: { type: Number, default: 0 },
  },
  { _id: false }
);

const PostSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },
    dishName: {
      type: String,
      trim: true,
      default: "Món ngon mỗi ngày",
    },
    caption: {
      type: String,
      required: [true, "Caption/Content is required"],
      trim: true,
    },
    images: {
      type: [PostImageSchema],
      default: [],
    },
    recipeId: {
      type: Schema.Types.ObjectId,
      ref: "Recipe",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    reactions: {
      type: Map,
      of: String,
      default: new Map(),
    },
    reactionCounts: {
      type: PostReactionCountsSchema,
      default: () => ({
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      }),
    },
    totalReactions: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const idStr = ret._id ? ret._id.toString() : ret.id;
        ret.id = idStr;
        ret._id = idStr;
        // Mobile compatibility aliases
        ret.content = ret.caption;
        ret.likesCount = ret.totalReactions || 0;
        
        // Symmetrical author mapping
        if (ret.author && typeof ret.author === "object") {
          const authId = ret.author._id ? ret.author._id.toString() : ret.author.id;
          ret.author.id = authId;
          ret.author.name = ret.author.fullName || `${ret.author.firstName || ""} ${ret.author.lastName || ""}`.trim() || "Đầu bếp SmartCook";
          ret.author.badge = ret.author.level || "Đầu Bếp Tại Gia";
          ret.author.isChef = ret.author.level === "Bếp trưởng" || ret.author.level === "Đầu bếp tài ba";
        }

        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
PostSchema.index({ createdAt: -1 });
PostSchema.index({ tags: 1, createdAt: -1 });

export const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);
export default Post;
