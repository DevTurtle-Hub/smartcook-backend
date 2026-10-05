import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smartcook_db";

async function fixRecipeImages() {
  console.log("Connecting to MongoDB:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Cannot get MongoDB connection");
  }

  const recipesColl = db.collection("recipes");

  // 1. Delete all corrupt black 149-byte Cloudinary test recipes
  const deleteResult = await recipesColl.deleteMany({
    title: /Test Mobile/i,
    image: /cloudinary\.com/i,
  });
  console.log(`Deleted ${deleteResult.deletedCount} corrupted black test recipes.`);

  // 2. Update remaining "Canh Chua Cá Hồi Test Mobile" or "Canh Chua Cá Hồi" to authentic image & clean title
  const updateCanhChua = await recipesColl.updateMany(
    { title: /Canh Chua Cá Hồi/i },
    {
      $set: {
        title: "Canh Chua Cá Hồi Miền Tây",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80",
        description: "Vị chua thanh mát của me và dứa hòa quyện vị ngọt béo tự nhiên của cá hồi tươi, thơm lừng ngò gai rau ngổ chuẩn vị miền Tây.",
      },
    }
  );
  console.log(`Updated ${updateCanhChua.modifiedCount} Canh Chua Cá Hồi recipes.`);

  // 3. Update "Cơm Gà Teriyaki Áp Chảo" with genuine Teriyaki chicken rice image
  const updateComGa = await recipesColl.updateOne(
    { title: /Cơm Gà Teriyaki/i },
    {
      $set: {
        image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80",
      },
    }
  );
  console.log(`Updated Cơm Gà Teriyaki: matched ${updateComGa.matchedCount}, modified ${updateComGa.modifiedCount}`);

  // 4. Update "Đậu Hũ Nhồi Thịt Sốt Cà Chua" with genuine golden braised tofu image
  const updateDauHu = await recipesColl.updateOne(
    { title: /Đậu Hũ Nhồi Thịt/i },
    {
      $set: {
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80",
      },
    }
  );
  console.log(`Updated Đậu Hũ Nhồi Thịt: matched ${updateDauHu.matchedCount}, modified ${updateDauHu.modifiedCount}`);

  // 5. Verify all recipes currently in database
  const allRecipes = await recipesColl.find({}, { projection: { title: 1, image: 1, category: 1 } }).toArray();
  console.log("\n=== CURRENT RECIPES IN DATABASE ===");
  allRecipes.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r._id}] ${r.title}\n   -> Image: ${r.image}`);
  });

  await mongoose.disconnect();
  console.log("\nFinished database recipe image migration successfully!");
}

fixRecipeImages().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
