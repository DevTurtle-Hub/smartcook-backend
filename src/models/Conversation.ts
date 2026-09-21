import mongoose, { Document, Model, Schema } from "mongoose";

export type ConversationType = "direct" | "room";

export interface IConversationMember {
  userId: mongoose.Types.ObjectId;
  joinedAt: Date;
  lastReadAt?: Date;
}

export interface IConversation extends Document {
  type: ConversationType;
  participants: mongoose.Types.ObjectId[];
  members: IConversationMember[];
  roomCode?: string;
  title?: string;
  description?: string;
  iconName?: string;
  tags: string[];
  isAiBot: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  lastSender?: mongoose.Types.ObjectId;
  activeMembers: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationMemberSchema = new Schema<IConversationMember>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadAt: {
      type: Date,
    },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      enum: ["direct", "room"],
      required: true,
      default: "direct",
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    members: {
      type: [ConversationMemberSchema],
      default: [],
    },
    roomCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    iconName: {
      type: String,
      default: "chat",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isAiBot: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: String,
      trim: true,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
    lastSender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    activeMembers: {
      type: Number,
      default: 1,
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
        delete ret.__v;
        return ret;
      },
    },
  }
);

ConversationSchema.index({ type: 1, updatedAt: -1 });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);
export default Conversation;
