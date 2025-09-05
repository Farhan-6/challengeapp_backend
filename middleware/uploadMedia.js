// backend/middleware/uploadMedia.js
import multer from "multer";

const MAX_MEDIA_SIZE = Number(process.env.MAX_UPLOAD_SIZE || 50 * 1024 * 1024);

// Always use memory storage so we never create local upload directories.
// Handlers should use req.file.buffer for further processing (upload to cloud or DB).
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
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
