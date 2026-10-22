import { readFileSync } from "node:fs";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary";
async function main() {
  const data = readFileSync("../smartcook-mobile/assets/images/hero-teriyaki-bowl.jpg");
  const uploaded = await uploadToCloudinary(data, "smartcook/validation");
  try {
    if (!uploaded.url.startsWith("https://")) throw new Error("No image URL");
    console.log("PASS: image upload to configured scan storage.");
  } finally {
    if (!await deleteFromCloudinary(uploaded.publicId)) throw new Error("Test image cleanup failed");
    console.log("PASS: removed only the image created by this validation.");
  }
}
main().catch(() => { console.error("Scan storage validation failed"); process.exitCode = 1; });
