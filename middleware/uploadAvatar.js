// backend/middleware/uploadAvatar.js
import multer from "multer";
import path from "path";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";

const USE_CLOUDINARY = (process.env.USE_CLOUDINARY || "false").toLowerCase() === "true";
const LOCAL_AVATARS_DIR = path.join(process.cwd(), "uploads", "avatars");
const AVATAR_MAX_SIZE = Number(process.env.AVATAR_MAX_SIZE || 2 * 1024 * 1024);

// memory when uploading to cloud, lazy-disk otherwise
let storage;
if (USE_CLOUDINARY) {
  storage = multer.memoryStorage(); // req.file.buffer present
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        fs.ensureDirSync(LOCAL_AVATARS_DIR);
        cb(null, LOCAL_AVATARS_DIR);
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
  // tight validation for avatars
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPEG, PNG or WEBP images are allowed"));
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: AVATAR_MAX_SIZE },
});
