import multer from "multer";
import { AppError, BadRequestError } from "../utils/errors";
import type { RequestHandler } from "express";

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

const singleImageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
}).single("image");

export const uploadSingleImage: RequestHandler = (req, res, next) => {
  singleImageUpload(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      next(new AppError("Ảnh vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.", 413));
      return;
    }
    next(error);
  });
};

export const uploadMultipleImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file limit
    files: 5, // Maximum 5 files
  },
  fileFilter,
}).array("images", 5);

export const uploadAvatar = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
}).single("avatar");
