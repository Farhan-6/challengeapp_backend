// controllers/challenge.controller.js

import { addChallenge, fetchAllChallenges, fetchChallenge, modifyChallenge, removeChallenge } from "../services/challenge.service.js";


export const create = async (req, res) => {
  try {
    const userId = req.user.id; // comes from JWT
    const payload = {
      ...req.body,
      creator_id: userId, // enforce creator
    };

    const result = await addChallenge(payload);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const getOne = async (req, res) => {
  try {
    const result = await fetchChallenge(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const result = await fetchAllChallenges();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const challenge = await fetchChallenge(req.params.id);

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (challenge.creator_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to update this challenge" });
    }

    const result = await modifyChallenge(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const challenge = await fetchChallenge(req.params.id);

    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (challenge.creator_id !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to delete this challenge" });
    }

    const result = await removeChallenge(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

