// controllers/vote.controller.js

import { addVote, countVotesForParticipant } from "../services/vote.service.js";

export const castVote = async (req, res) => {
  const { participantId, voterId } = req.body;

  try {
    const result = await addVote(participantId, voterId);
    res.json(result);
  } catch (err) {
    console.error("Vote error:", err);
    res.status(400).json({ error: err.message });
  }
};

export const getVoteCount = async (req, res) => {
  const { participantId } = req.params;

  try {
    const total = await countVotesForParticipant(participantId);
    res.json({ participantId, total });
  } catch (err) {
    console.error("Vote count error:", err);
    res.status(500).json({ error: err.message });
  }
};
