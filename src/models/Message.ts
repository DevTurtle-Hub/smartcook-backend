import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  imageUri?: string;
  imagePublicId?: string;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation ID is required"],
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"],
      index: true,
    },
    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
    },
    imageUri: {
      type: String,
      trim: true,
    },
    imagePublicId: {
      type: String,
      trim: true,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        const idStr = ret._id ? ret._id.toString() : ret.id;
        ret.id = idStr;
        ret._id = idStr;

        if (ret.sender && typeof ret.sender === "object") {
          const sId = ret.sender._id ? ret.sender._id.toString() : ret.sender.id;
          ret.sender.id = sId;
          ret.sender.name =
            ret.sender.fullName ||
            `${ret.sender.firstName || ""} ${ret.sender.lastName || ""}`.trim() ||
            "Người dùng";
          ret.sender.badge = ret.sender.level || "Thành Viên";
          ret.sender.isChef =
            ret.sender.level === "Bếp trưởng" || ret.sender.level === "Đầu bếp tài ba";
        }

        delete ret.__v;
        return ret;
      },
    },
  }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);
export default Message;
