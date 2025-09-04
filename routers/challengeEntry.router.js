import { Router } from "express";
import { getByChallenge, getOne, update, remove, joinChallenge, rewardWinner } from "../controllers/challengeEntry.controller.js";

const router = Router();

router.post("/join/:challengeId", joinChallenge);
router.get("/challenge/:challenge_id", getByChallenge)
router.get("/get/:id", getOne);
router.put("/update/:id", update);
router.delete("/delete/:id", remove);
router.post("/reward", rewardWinner);

export default router;
