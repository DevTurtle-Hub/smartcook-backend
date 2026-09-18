import mongoose, { Document, Model, Schema } from "mongoose";
import { IngredientCategory, INGREDIENT_CATEGORIES } from "./Ingredient";
import { normalizeVietnamese } from "../utils/text";

export type StorageLocation = "chilled" | "frozen" | "pantry";

export interface IFridgeItem {
  _id?: mongoose.Types.ObjectId;
  ingredientId?: mongoose.Types.ObjectId;
  name: string;
  normalizedName: string;
  amount: string;
  category: IngredientCategory;
  storageLocation: StorageLocation;
  expiryDate?: Date;
  note?: string;
  addedAt: Date;
}

export interface IUserFridge extends Document {
  userId: mongoose.Types.ObjectId;
  items: IFridgeItem[];
  createdAt: Date;
  updatedAt: Date;
}

const FridgeItemSchema = new Schema<IFridgeItem>(
  {
    ingredientId: {
      type: Schema.Types.ObjectId,
      ref: "Ingredient",
    },
    name: {
      type: String,
      required: [true, "Ingredient name is required"],
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: String,
      default: "1",
      trim: true,
    },
    category: {
      type: String,
      enum: INGREDIENT_CATEGORIES,
      default: "veggies",
    },
    storageLocation: {
      type: String,
      enum: ["chilled", "frozen", "pantry"],
      default: "chilled",
    },
    expiryDate: {
      type: Date,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

FridgeItemSchema.pre<IFridgeItem>("validate", function () {
  if (this.name) {
    this.normalizedName = normalizeVietnamese(this.name);
  }
});

const UserFridgeSchema = new Schema<IUserFridge>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [FridgeItemSchema],
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
  }
);

export const UserFridge: Model<IUserFridge> = mongoose.model<IUserFridge>(
  "UserFridge",
  UserFridgeSchema
);
export default UserFridge;
