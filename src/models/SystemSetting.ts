import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAIConfig {
  systemPrompt: string;
  personaTone: string;
  selectedModel: string;
  quickPrompts: string[];
  visionConfidenceThreshold: number;
  maxIngredientsPerScan: number;
  enableBoundingBoxes: boolean;
}

export interface ISystemSetting extends Document {
  key: string;
  appName: string;
  appVersion: string;
  geminiApiKey: string;
  cloudinaryName: string;
  pushServiceKey: string;
  visionEndpoint: string;
  aiConfig: IAIConfig;
  createdAt: Date;
  updatedAt: Date;
}

const AIConfigSchema = new Schema<IAIConfig>(
  {
    systemPrompt: {
      type: String,
      default:
        "Bạn là Bếp Trưởng SmartCook AI - Chuyên gia ẩm thực và dinh dưỡng hàng đầu. Hãy tư vấn nhiệt tình, đưa ra định lượng chuẩn xác và tính toán calories hợp lý.",
      maxlength: 3000,
    },
    personaTone: {
      type: String,
      default: "enthusiastic",
    },
    selectedModel: {
      type: String,
      default: "gemini-2.5-flash",
    },
    quickPrompts: {
      type: [String],
      default: [
        "Tối nay ăn gì nhanh dưới 20 phút?",
        "Tủ lạnh chỉ có ức gà và trứng, nấu món gì ngon?",
        "Bí quyết ướp thịt nướng mềm mọng không bị khô?",
        "Gợi ý thực đơn Eat Clean 1500 calo cho người bận rộn",
        "Cách nhận biết thực phẩm đông lạnh còn tươi hay không?",
      ],
    },
    visionConfidenceThreshold: {
      type: Number,
      default: 85,
      min: 50,
      max: 100,
    },
    maxIngredientsPerScan: {
      type: Number,
      default: 12,
      min: 1,
      max: 50,
    },
    enableBoundingBoxes: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global_settings",
      index: true,
    },
    appName: {
      type: String,
      default: "SmartCook - Trợ Lý Ẩm Thực Thông Minh",
      maxlength: 200,
    },
    appVersion: {
      type: String,
      default: "2.4.0 (Build 108)",
      maxlength: 50,
    },
    geminiApiKey: {
      type: String,
      default: "AIzaSyD-•••••••••••••••••••••••_SmartCookLive",
    },
    cloudinaryName: {
      type: String,
      default: "smartcook-cloud-storage",
    },
    pushServiceKey: {
      type: String,
      default: "AAAA-••••••••••••••••••••-FCM-Live",
    },
    visionEndpoint: {
      type: String,
      default: "https://vision.smartcook.vn/v1/detect",
    },
    aiConfig: {
      type: AIConfigSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, any>) {
        ret.id = ret._id?.toString() || ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const SystemSetting: Model<ISystemSetting> = mongoose.model<ISystemSetting>(
  "SystemSetting",
  SystemSettingSchema
);

export default SystemSetting;
