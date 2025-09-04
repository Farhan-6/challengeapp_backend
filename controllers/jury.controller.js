// controllers/jury.controller.js
import { jurySelectWinner, finalizeWinner } from "../services/jury.service.js";

export const castJuryDecision = async (req, res) => {
  const { challengeId, juryId, winnerEntryId } = req.body;

  try {
    const result = await jurySelectWinner(challengeId, juryId, winnerEntryId);
    res.json(result);
  } catch (err) {
    console.error("Jury decision error:", err);
    res.status(500).json({ error: err.message });
  }
};

export const finalizeChallengeWinner = async (req, res) => {
  const { challengeId } = req.params;

  try {
    const result = await finalizeWinner(challengeId);
    res.json(result);
  } catch (err) {
    console.error("Finalize winner error:", err);
    res.status(500).json({ error: err.message });
  }
};
