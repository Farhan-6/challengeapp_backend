// backend/middleware/uploadMedia.js
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import os from "os";
import { v4 as uuidv4 } from "uuid";

const USE_CLOUDINARY = (process.env.USE_CLOUDINARY || "false").toLowerCase() === "true";
const LOCAL_PROOFS_DIR = path.join(process.cwd(), "uploads", "proofs");
const MAX_MEDIA_SIZE = Number(process.env.MAX_UPLOAD_SIZE || 50 * 1024 * 1024);

// choose storage: memory for cloud uploads, disk (lazy) for local storage
let storage;
if (USE_CLOUDINARY) {
  storage = multer.memoryStorage(); // keeps files in req.file.buffer -> no dirs created
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        // create directory only when an upload is happening
        fs.ensureDirSync(LOCAL_PROOFS_DIR);
        cb(null, LOCAL_PROOFS_DIR);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || "";
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "video/mp4",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-ms-wmv",
    "video/webm",
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported media type"));
};

export const uploadMedia = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_MEDIA_SIZE },
});
