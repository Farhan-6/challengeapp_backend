// routes/vote.routes.js
import express from "express";
import { castVote, getVoteCount } from "../controllers/vote.controller.js";
import { authenticate } from "../libs/auth.js";

const router = express.Router();

// Cast a vote
router.post("/", authenticate ,castVote);

// Get vote count for an entry
router.get("/:participantId", getVoteCount);

export default router;
