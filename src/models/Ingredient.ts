import mongoose, { Document, Model, Schema } from "mongoose";
import { normalizeVietnamese } from "../utils/text";

export type IngredientCategory =
  | "meat"
  | "seafood"
  | "greens"
  | "veggies"
  | "herbs"
  | "fruits"
  | "egg_tofu"
  | "dairy"
  | "carbs"
  | "grain"
  | "seasoning"
  | "spice"
  | "sauces"
  | "dry";

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  "meat",
  "seafood",
  "greens",
  "veggies",
  "herbs",
  "fruits",
  "egg_tofu",
  "dairy",
  "carbs",
  "grain",
  "seasoning",
  "spice",
  "sauces",
  "dry",
];

export interface IIngredient extends Document {
  name: string;
  normalizedName: string;
  aliases: string[];
  category: IngredientCategory;
  subCategory?: string;
  icon?: string;
  defaultUnit: string;
  averagePrice?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredient>(
  {
    name: {
      type: String,
      required: [true, "Ingredient name is required"],
      trim: true,
      index: true,
    },
    normalizedName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    aliases: {
      type: [String],
      default: [],
      index: true,
    },
    category: {
      type: String,
      enum: INGREDIENT_CATEGORIES,
      required: [true, "Category is required"],
      index: true,
    },
    subCategory: {
      type: String,
      trim: true,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
    defaultUnit: {
      type: String,
      default: "g",
      trim: true,
    },
    averagePrice: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

// Pre-save hook to ensure normalizedName is always computed
IngredientSchema.pre<IIngredient>("validate", function () {
  if (this.name) {
    this.normalizedName = normalizeVietnamese(this.name);
  }
  if (this.aliases && Array.isArray(this.aliases)) {
    this.aliases = this.aliases.map((alias) => normalizeVietnamese(alias));
  }
});

// Create text index for search
IngredientSchema.index({ name: "text", normalizedName: "text", aliases: "text" });

export const Ingredient: Model<IIngredient> = mongoose.model<IIngredient>(
  "Ingredient",
  IngredientSchema
);
export default Ingredient;
