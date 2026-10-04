import mongoose, { Document, Model, Schema } from "mongoose";

export type ReportTargetType = "post" | "comment" | "recipe" | "user";
export type ReportReason =
  | "spam"
  | "inappropriate"
  | "harassment"
  | "misleading"
  | "other";
export type ReportStatus =
  | "pending"
  | "reviewed"
  | "resolved"
  | "dismissed"
  | "action_taken";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  targetType: ReportTargetType;
  targetId: mongoose.Types.ObjectId;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolvedBy?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  resolvedAt?: Date;
  targetPreview?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Người báo cáo không được để trống"],
      index: true,
    },
    targetType: {
      type: String,
      enum: ["post", "comment", "recipe", "user"],
      required: [true, "Loại đối tượng báo cáo không được để trống"],
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, "ID đối tượng báo cáo không được để trống"],
      index: true,
    },
    reason: {
      type: String,
      enum: ["spam", "inappropriate", "harassment", "misleading", "other"],
      required: [true, "Lý do báo cáo không được để trống"],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Mô tả không được vượt quá 1000 ký tự"],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed", "action_taken"],
      default: "pending",
      index: true,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [1000, "Ghi chú xử lý không được vượt quá 1000 ký tự"],
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    targetPreview: {
      type: String,
      trim: true,
      default: "",
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
        ret.reportedAt = ret.createdAt;
        if (ret.reporterId && typeof ret.reporterId === "object") {
          ret.reporterName =
            ret.reporterId.fullName ||
            `${ret.reporterId.firstName || ""} ${ret.reporterId.lastName || ""}`.trim() ||
            ret.reporterId.email ||
            "Người dùng";
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for high-frequency queries
ReportSchema.index({ targetId: 1, targetType: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });

export const Report: Model<IReport> = mongoose.model<IReport>(
  "Report",
  ReportSchema
);
export default Report;
