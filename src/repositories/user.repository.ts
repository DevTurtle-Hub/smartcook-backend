import mongoose from "mongoose";
import User, { IUser, IUserPreferences } from "../models/User";

export class UserRepository {
  async findByEmail(email: string, selectPassword = false): Promise<IUser | null> {
    const query = User.findOne({ email: email.toLowerCase().trim() });
    if (selectPassword) {
      query.select("+password");
    }
    return query.exec();
  }

  async findById(id: string, selectRefreshToken = false): Promise<IUser | null> {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
    const query = User.findById(id);
    if (selectRefreshToken) {
      query.select("+refreshToken");
    }
    return query.exec();
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId }).exec();
  }

  async linkGoogleId(userId: string, googleId: string, avatar?: string): Promise<IUser | null> {
    const updatePayload: Record<string, any> = { googleId };
    if (avatar) {
      updatePayload.avatar = avatar;
    }
    return User.findByIdAndUpdate(userId, updatePayload, {
      returnDocument: "after",
    }).exec();
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).exec();
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await User.findByIdAndUpdate(id, { refreshToken }).exec();
  }

  async updatePreferences(
    id: string,
    preferences: Partial<IUserPreferences>
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      id,
      {
        $set: {
          "preferences.hasCompletedSurvey": true,
          "preferences.updatedAt": new Date(),
          ...(preferences.portion && { "preferences.portion": preferences.portion }),
          ...(preferences.cuisines && { "preferences.cuisines": preferences.cuisines }),
          ...(preferences.healthGoal && { "preferences.healthGoal": preferences.healthGoal }),
          ...(preferences.restrictions && { "preferences.restrictions": preferences.restrictions }),
          ...(preferences.tasteProfile && { "preferences.tasteProfile": preferences.tasteProfile }),
          ...(preferences.cookingTime && { "preferences.cookingTime": preferences.cookingTime }),
        },
      },
      { returnDocument: "after" }
    ).exec();
  }

  async addFavoriteRecipe(userId: string, recipeId: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteRecipeIds: recipeId } },
      { returnDocument: "after" }
    ).exec();
  }

  async removeFavoriteRecipe(userId: string, recipeId: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $pull: { favoriteRecipeIds: recipeId } },
      { returnDocument: "after" }
    ).exec();
  }

  async addChefExp(userId: string, exp: number): Promise<IUser | null> {
    const user = await User.findById(userId);
    if (!user) return null;

    user.chefExp = (user.chefExp || 0) + exp;
    if (user.chefExp >= 500) {
      user.level = "Bếp trưởng";
    } else if (user.chefExp >= 250) {
      user.level = "Đầu bếp tài ba";
    } else if (user.chefExp >= 100) {
      user.level = "Bếp gia đình";
    } else {
      user.level = "Tập sự";
    }

    return user.save();
  }
}

export const userRepository = new UserRepository();
export default userRepository;
