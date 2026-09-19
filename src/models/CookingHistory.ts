import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICookingHistory extends Document {
  userId: mongoose.Types.ObjectId;
  recipeId: mongoose.Types.ObjectId;
  recipeName: string;
  image: string;
  cookedAt: Date;
  durationMinutes: number;
  servings: number;
  usedIngredients: string[];
  calories: number;
  rating?: number;
  xpEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

const CookingHistorySchema = new Schema<ICookingHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    recipeId: {
      type: Schema.Types.ObjectId,
      ref: "Recipe",
      required: [true, "Recipe ID is required"],
      index: true,
    },
    recipeName: {
      type: String,
      required: [true, "Recipe name is required"],
      trim: true,
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
      trim: true,
    },
    cookedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration in minutes is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    servings: {
      type: Number,
      required: [true, "Servings count is required"],
      min: [1, "Servings must be at least 1"],
      default: 2,
    },
    usedIngredients: {
      type: [String],
      default: [],
    },
    calories: {
      type: Number,
      required: [true, "Calories is required"],
      min: [0, "Calories cannot be negative"],
      default: 0,
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    xpEarned: {
      type: Number,
      default: 50,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "cooking_histories",
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (_doc, ret: any) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CookingHistorySchema.index({ userId: 1, cookedAt: -1 });

export const CookingHistory: Model<ICookingHistory> =
  mongoose.models.CookingHistory ||
  mongoose.model<ICookingHistory>("CookingHistory", CookingHistorySchema);

export default CookingHistory;
