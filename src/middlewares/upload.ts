import multer from "multer";
import { BadRequestError } from "../utils/errors";

// Use memory storage to process buffers and stream to Cloudinary
const storage = multer.memoryStorage();

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Invalid file type (${file.mimetype}). Only JPG, PNG, WEBP, and GIF images are allowed.`
      )
    );
  }
};

export const uploadSingleImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
}).single("image");

export const uploadMultipleImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file limit
    files: 5, // Maximum 5 files
  },
  fileFilter,
}).array("images", 5);
