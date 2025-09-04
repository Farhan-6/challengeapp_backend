// backend/routers/media.router.js
import { Router } from "express";
import { uploadMedia as uploadHandler } from "../controllers/media.controller.js";
import { uploadMedia } from "../middleware/uploadMedia.js";
import { listMedia, getMedia, deleteMedia } from "../controllers/media.controller.js";
import { authenticate } from "../libs/auth.js";

const router = Router();

router.post("/upload", authenticate, uploadMedia.single("file"), uploadHandler);
router.get("/", authenticate, listMedia);
router.get("/:id", authenticate, getMedia);
router.delete("/:id", authenticate, deleteMedia);

export default router;
