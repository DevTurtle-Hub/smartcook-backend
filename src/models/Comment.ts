import mongoose, { Document, Model, Schema } from "mongoose";

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  parentCommentId?: mongoose.Types.ObjectId;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post ID is required"],
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      index: true,
    },
    likesCount: {
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
        
        if (ret.author && typeof ret.author === "object") {
          const authId = ret.author._id ? ret.author._id.toString() : ret.author.id;
          ret.author.id = authId;
          ret.author.name = ret.author.fullName || `${ret.author.firstName || ""} ${ret.author.lastName || ""}`.trim() || "Thành viên";
          ret.author.badge = ret.author.level || "Thành Viên";
          ret.author.isChef = ret.author.level === "Bếp trưởng" || ret.author.level === "Đầu bếp tài ba";
        }

        delete ret.__v;
        return ret;
      },
    },
  }
);

CommentSchema.index({ postId: 1, createdAt: -1 });

export const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);
export default Comment;
