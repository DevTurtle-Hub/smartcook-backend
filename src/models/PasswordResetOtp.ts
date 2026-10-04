import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPasswordResetOtp extends Document {
  email: string;
  otpHash: string;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetOtpSchema = new Schema<IPasswordResetOtp>(
  {
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: [true, "Mã hash OTP là bắt buộc"],
    },
    expiresAt: {
      type: Date,
      required: true,
      // MongoDB automatic TTL index: document will expire and be deleted automatically after expiresAt
      expires: 0,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

PasswordResetOtpSchema.index({ email: 1, isUsed: 1, expiresAt: 1 });

export const PasswordResetOtp: Model<IPasswordResetOtp> =
  (mongoose.models.PasswordResetOtp as Model<IPasswordResetOtp>) ||
  mongoose.model<IPasswordResetOtp>("PasswordResetOtp", PasswordResetOtpSchema);

export default PasswordResetOtp;
