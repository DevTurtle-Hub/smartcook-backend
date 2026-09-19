import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB, { disconnectDB } from "../config/db";
import User from "../models/User";

const seedUsers = async () => {
  try {
    console.log("[Seed] Connecting to database...");
    await connectDB();

    const hashedPasswordAdmin = await bcrypt.hash("Admin123@", 12);
    const hashedPasswordUser = await bcrypt.hash("Password123@", 12);

    // 1. Admin account
    const adminData = {
      firstName: "Quản Trị",
      lastName: "Hệ Thống",
      email: "admin@smartcook.com",
      password: hashedPasswordAdmin,
      authType: "local",
      role: "admin",
      chefExp: 999,
      level: "Bếp trưởng",
      isActive: true,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      preferences: {
        hasCompletedSurvey: true,
        portion: "3-4",
        cuisines: ["vietnamese", "healthy"],
        healthGoal: "healthy",
        restrictions: [],
        tasteProfile: ["dam-da"],
        cookingTime: "medium",
        updatedAt: new Date(),
      },
    };

    // 2. User account
    const userData = {
      firstName: "Minh",
      lastName: "Nguyễn",
      email: "user@smartcook.com",
      password: hashedPasswordUser,
      authType: "local",
      role: "user",
      chefExp: 150,
      level: "Bếp gia đình",
      isActive: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      preferences: {
        hasCompletedSurvey: true,
        portion: "3-4",
        cuisines: ["vietnamese", "asian"],
        healthGoal: "healthy",
        restrictions: [],
        tasteProfile: ["thanh-dam"],
        cookingTime: "quick",
        updatedAt: new Date(),
      },
    };

    // Upsert Admin
    const admin = await User.findOneAndUpdate(
      { email: adminData.email },
      { $set: adminData },
      { upsert: true, new: true }
    );
    console.log(`[Seed] Successfully seeded/updated admin: ${admin.email} (Role: ${admin.role})`);

    // Upsert User
    const regularUser = await User.findOneAndUpdate(
      { email: userData.email },
      { $set: userData },
      { upsert: true, new: true }
    );
    console.log(`[Seed] Successfully seeded/updated user: ${regularUser.email} (Role: ${regularUser.role})`);

    console.log("[Seed] All demo users seeded successfully!");
  } catch (error) {
    console.error("[Seed] Error seeding users:", error);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

seedUsers();
