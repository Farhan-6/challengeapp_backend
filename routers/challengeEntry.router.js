import { Router } from "express";
import { create, getByChallenge, getOne, update, remove, joinChallenge } from "../controllers/challengeEntry.controller.js";

const router = Router();

router.post("/join/:challengeId", joinChallenge);
router.post("/create", create);
router.get("/challenge/:challenge_id", getByChallenge);
router.get("/get/:id", getOne);
router.put("/update/:id", update);
router.delete("/delete/:id", remove);

export default router;
