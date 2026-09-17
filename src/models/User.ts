import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export type PortionType = "1" | "2" | "3-4" | "5+";
export type HealthGoalType = "healthy" | "loss" | "muscle" | "budget";
export type CookingTimeType = "quick" | "medium" | "standard" | "slow";
export type UserRole = "user" | "admin";

export interface IUserPreferences {
  hasCompletedSurvey: boolean;
  portion: PortionType;
  cuisines: string[];
  healthGoal: HealthGoalType;
  restrictions: string[];
  tasteProfile: string[];
  cookingTime: CookingTimeType;
  updatedAt: Date;
}

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  password?: string;
  avatar?: string;
  role: UserRole;
  chefExp: number;
  level: string;
  preferences: IUserPreferences;
  favoriteRecipeIds: mongoose.Types.ObjectId[];
  refreshToken?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    hasCompletedSurvey: {
      type: Boolean,
      default: false,
    },
    portion: {
      type: String,
      enum: ["1", "2", "3-4", "5+"],
      default: "3-4",
    },
    cuisines: {
      type: [String],
      default: ["vietnamese", "healthy"],
    },
    healthGoal: {
      type: String,
      enum: ["healthy", "loss", "muscle", "budget"],
      default: "healthy",
    },
    restrictions: {
      type: [String],
      default: [],
    },
    tasteProfile: {
      type: [String],
      default: ["dam-da"],
    },
    cookingTime: {
      type: String,
      enum: ["quick", "medium", "standard", "slow"],
      default: "medium",
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Do not return password by default
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    chefExp: {
      type: Number,
      default: 0,
    },
    level: {
      type: String,
      default: "Tập sự",
    },
    preferences: {
      type: UserPreferencesSchema,
      default: () => ({}),
    },
    favoriteRecipeIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Recipe",
      },
    ],
    refreshToken: {
      type: String,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret: any) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual field for fullName
UserSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Pre-save hook to hash password with bcrypt
UserSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password") || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
