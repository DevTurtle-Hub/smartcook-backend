import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file buffer directly to Cloudinary using upload_stream
 * @param fileBuffer The buffer from multer (file.buffer)
 * @param folder The destination folder in Cloudinary
 * @returns Promise<{ url: string; publicId: string }>
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = "smartcook/general"
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error("Failed to upload image to Cloudinary"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Extract publicId from a Cloudinary URL
 * Example: https://res.cloudinary.com/demo/image/upload/v1612345678/smartcook/general/abc123xyz.jpg
 * Returns: smartcook/general/abc123xyz
 */
export const extractCloudinaryPublicId = (url?: string): string | null => {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;

  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let pathAfterUpload = url.substring(uploadIndex + 8);
    // Strip version prefix if present, e.g. v123456789/
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, "");

    // Strip file extension if present (.jpg, .png, etc.)
    const lastDotIndex = pathAfterUpload.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, lastDotIndex);
    }

    return pathAfterUpload || null;
  } catch {
    return null;
  }
};

/**
 * Delete an asset from Cloudinary by its publicId
 * @param publicId The public_id of the resource to delete
 * @returns Promise<boolean>
 */
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  if (!publicId || typeof publicId !== "string") return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return result.result === "ok" || result.result === "not found";
  } catch (err) {
    console.warn(`[Cloudinary] Failed to delete asset with publicId: ${publicId}`, err);
    return false;
  }
};

export default cloudinary;
