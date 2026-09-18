import mongoose, { Document, Model, Schema } from "mongoose";
import { normalizeVietnamese } from "../utils/text";

export type RecipeDifficulty = "Dễ" | "Trung bình" | "Nâng cao";

export interface IRecipeIngredient {
  name: string;
  normalizedName?: string;
  amount: string;
  isOptional?: boolean;
  icon?: string;
}

export interface IRecipeStep {
  stepNumber: number;
  title: string;
  description: string;
  timerMinutes?: number;
  tip?: string;
}

export interface IRecipeNutrition {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sodium?: string;
  advice: string;
}

export interface IRecipe extends Document {
  title: string;
  author: string;
  authorId?: mongoose.Types.ObjectId;
  calories: number;
  minutes: number;
  difficulty: RecipeDifficulty;
  servings: string;
  servingsCount: number;
  price: string;
  rating: number;
  reviewCount: number;
  categoryCode: string;
  badge: string;
  sub: string;
  tags: string[];
  image: string;
  description: string;
  ingredients: IRecipeIngredient[];
  steps: IRecipeStep[];
  nutrition: IRecipeNutrition;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecipeIngredientSchema = new Schema<IRecipeIngredient>(
  {
    name: {
      type: String,
      required: [true, "Ingredient name is required"],
      trim: true,
    },
    normalizedName: {
      type: String,
      trim: true,
    },
    amount: {
      type: String,
      required: [true, "Amount is required"],
      trim: true,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
    icon: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

RecipeIngredientSchema.pre<IRecipeIngredient>("validate", function () {
  if (this.name && !this.normalizedName) {
    this.normalizedName = normalizeVietnamese(this.name);
  }
});

const RecipeStepSchema = new Schema<IRecipeStep>(
  {
    stepNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: [true, "Step title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Step description is required"],
      trim: true,
    },
    timerMinutes: {
      type: Number,
      default: 0,
    },
    tip: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const RecipeNutritionSchema = new Schema<IRecipeNutrition>(
  {
    calories: { type: Number, required: true },
    protein: { type: String, default: "0g" },
    carbs: { type: String, default: "0g" },
    fat: { type: String, default: "0g" },
    fiber: { type: String, default: "0g" },
    sodium: { type: String, default: "0mg" },
    advice: { type: String, default: "" },
  },
  { _id: false }
);

const RecipeSchema = new Schema<IRecipe>(
  {
    title: {
      type: String,
      required: [true, "Recipe title is required"],
      trim: true,
      index: true,
    },
    author: {
      type: String,
      default: "@smartcook.chef",
      trim: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    calories: {
      type: Number,
      default: 0,
    },
    minutes: {
      type: Number,
      required: [true, "Cooking duration in minutes is required"],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Dễ", "Trung bình", "Nâng cao"],
      default: "Dễ",
      index: true,
    },
    servings: {
      type: String,
      default: "4 phần",
    },
    servingsCount: {
      type: Number,
      default: 4,
    },
    price: {
      type: String,
      default: "~50.000đ",
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    categoryCode: {
      type: String,
      required: [true, "Category code is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    badge: {
      type: String,
      default: "",
    },
    sub: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    image: {
      type: String,
      required: [true, "Recipe image URL is required"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    ingredients: {
      type: [RecipeIngredientSchema],
      required: true,
      validate: [
        (val: IRecipeIngredient[]) => val.length > 0,
        "Recipe must contain at least one ingredient",
      ],
    },
    steps: {
      type: [RecipeStepSchema],
      required: true,
      validate: [
        (val: IRecipeStep[]) => val.length > 0,
        "Recipe must contain at least one cooking step",
      ],
    },
    nutrition: {
      type: RecipeNutritionSchema,
      default: () => ({ calories: 0 }),
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

// Virtual field for stepsCount
RecipeSchema.virtual("stepsCount").get(function (this: IRecipe) {
  return this.steps ? this.steps.length : 0;
});

// Full-text search index on title, description, and tags
RecipeSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});

export const Recipe: Model<IRecipe> = mongoose.model<IRecipe>(
  "Recipe",
  RecipeSchema
);
export default Recipe;
