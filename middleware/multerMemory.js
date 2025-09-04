// middleware/multerMemory.js
import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit (adjust if you want)
  }
});

export default upload;
