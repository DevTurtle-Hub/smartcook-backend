import mongoose, { Document, Model, Schema } from "mongoose";

export type MealSlot = "Bữa Sáng" | "Bữa Trưa" | "Bữa Tối" | "Bữa Phụ";

export interface IMealSlotItem {
  _id?: mongoose.Types.ObjectId;
  slot: MealSlot;
  time: string; // e.g. "07:00", "12:00", "19:00"
  recipeId?: mongoose.Types.ObjectId;
  customTitle?: string;
  calories: number;
  isCooked: boolean;
  notes?: string;
}

export interface IPlannerDay {
  dayOfWeek: string; // "Thứ 2", "Thứ 3", ..., "CN"
  date: string; // "YYYY-MM-DD"
  meals: IMealSlotItem[];
}

export interface IMealPlan extends Document {
  userId: mongoose.Types.ObjectId;
  weekStartDate: Date; // Normalized to Monday 00:00:00 UTC
  days: IPlannerDay[];
  createdAt: Date;
  updatedAt: Date;
}

const MealSlotItemSchema = new Schema<IMealSlotItem>(
  {
    slot: {
      type: String,
      enum: ["Bữa Sáng", "Bữa Trưa", "Bữa Tối", "Bữa Phụ"],
      required: true,
      default: "Bữa Trưa",
    },
    time: {
      type: String,
      default: "12:00",
      trim: true,
    },
    recipeId: {
      type: Schema.Types.ObjectId,
      ref: "Recipe",
    },
    customTitle: {
      type: String,
      trim: true,
    },
    calories: {
      type: Number,
      default: 0,
      min: 0,
    },
    isCooked: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const PlannerDaySchema = new Schema<IPlannerDay>(
  {
    dayOfWeek: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    meals: {
      type: [MealSlotItemSchema],
      default: [],
    },
  },
  { _id: false }
);

const MealPlanSchema = new Schema<IMealPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    days: {
      type: [PlannerDaySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// One meal plan per user per week
MealPlanSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });

export const MealPlan: Model<IMealPlan> = mongoose.model<IMealPlan>(
  "MealPlan",
  MealPlanSchema
);
