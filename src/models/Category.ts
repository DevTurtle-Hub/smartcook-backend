import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICategory extends Document {
  code: string;
  name: string;
  icon: string;
  order: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    code: {
      type: String,
      required: [true, "Category code is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    icon: {
      type: String,
      default: "restaurant-outline",
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
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

export const Category: Model<ICategory> = mongoose.model<ICategory>(
  "Category",
  CategorySchema
);
export default Category;
