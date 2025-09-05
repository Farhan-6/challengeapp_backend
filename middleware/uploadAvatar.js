// backend/middleware/uploadAvatar.js
import multer from "multer";

const AVATAR_MAX_SIZE = Number(process.env.AVATAR_MAX_SIZE || 2 * 1024 * 1024);

// Always use memoryStorage to avoid creating local directories.
// Controllers/services should handle buffers (req.file.buffer) and upload to cloud or DB.
const storage = multer.memoryStorage();

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
