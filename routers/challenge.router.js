// routers/challenge.router.js
import { Router } from "express";
import { create, getAll, getOne, remove, update } from "../controllers/challenge.controller.js";
import { authenticate } from "../libs/auth.js";

const router = Router();

router.post("/create", authenticate, create);
router.get("/getall", getAll);
router.get("/get/:id", getOne);
router.put("/update/:id", authenticate, update);
router.delete("/delete/:id", authenticate, remove);

export default router;
