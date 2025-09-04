// routes/jury.routes.js
import express from "express";
import { castJuryDecision, finalizeChallengeWinner } from "../controllers/jury.controller.js";
import { authenticate } from "../libs/auth.js";

const router = express.Router();

// Jury casts decision
router.post("/decision", castJuryDecision);

// Finalize winner of challenge (decided by jury, may fallback to votes in case of tie)
router.post("/finalize/:challengeId",authenticate, finalizeChallengeWinner);

export default router;
