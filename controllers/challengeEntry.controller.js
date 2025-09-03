// controllers/challengeEntry.service.js
import { addEntry, addParticipantToChallenge, fetchEntriesByChallenge, fetchEntry, modifyEntry, removeEntry } from "../services/challengeEntry.service.js";


export const joinChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { participant_id, mediaUrl } = req.body;

    if (!participant_id) {
      return res.status(400).json({ error: "participant_id is required" });
    }

    const result = await addParticipantToChallenge(challengeId, participant_id, mediaUrl);
    res.status(201).json({ message: "Joined challenge successfully", entry: result });
  } catch (error) {
    if (error.message.includes("already joined")) {
      return res.status(409).json({ error: error.message })
    }
    res.status(400).json({ error: error.message });
  }
};


export const create = async (req, res) => {
  try {
    const result = await addEntry(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getByChallenge = async (req, res) => {
  try {
    const result = await fetchEntriesByChallenge(req.params.challenge_id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const getOne = async (req, res) => {
  try {
    const result = await fetchEntry(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const result = await modifyEntry(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await removeEntry(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
