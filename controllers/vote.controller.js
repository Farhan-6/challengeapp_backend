// controllers/vote.controller.js

import { addVote, countVotesForParticipant } from "../services/vote.service.js";

export const castVote = async (req, res) => {
  const { challengeId, participantId } = req.body;
  const voterId = req.user?.id || req.body.voterId;  
  // Prefer JWT, fallback to body for testing in Postman

  if (!challengeId || !participantId || !voterId) {
    return res.status(400).json({ error: "Missing challengeId, participantId or voterId" });
  }

  try {
    const result = await addVote(challengeId, participantId, voterId);
    res.json(result);
  } catch (err) {
    console.error("Vote error:", err);
    res.status(400).json({ error: err.message });
  }
};

export const getVoteCount = async (req, res) => {
  const { challengeId, participantId } = req.params;

  if (!challengeId || !participantId) {
    return res.status(400).json({ error: "Missing challengeId or participantId" });
  }

  try {
    const total = await countVotesForParticipant(challengeId, participantId);
    res.json({ challengeId, participantId, total });
  } catch (err) {
    console.error("Vote count error:", err);
    res.status(500).json({ error: err.message });
  }
};
