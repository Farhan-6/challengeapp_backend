// services/challengeEntry.service.js
import { v4 as uuidv4 } from "uuid";
import connectDB from "../libs/db.js";
import { ChallengeEntry } from "../models/challengeEntry.model.js";

export const addParticipantToChallenge = async (challengeId, participant_id, mediaUrl = null) => {
    const db = await connectDB();

    // Check if participant exists
    const [userRows] = await db.query(
        `SELECT id FROM users WHERE id = ?`,
        [participant_id]
    );
    if (userRows.length === 0) {
        throw new Error("Participant does not exist")
    }

    // Check if already joined
    const [existing] = await db.query(
        `SELECT id FROM challenge_enteries WHERE challenge_id = ? AND participant_id = ?`,
        [challengeId, participant_id]
    );
    if (existing.length > 0) {
        throw new Error("Participant has already joined this challenge");
    }

    //  Insert new row
    const id = uuidv4();
    await db.query(
        `INSERT INTO challenge_enteries (id, challenge_id, participant_id, media_url)
         VALUES (?, ?, ?, ?)`,
        [id, challengeId, participant_id, mediaUrl]
    );

    return { id, challenge_id: challengeId, participant_id, media_url: mediaUrl };
};


export const addEntry = async (data) => {
  const db = await connectDB();
  const id = uuidv4();
  const newData = { id, ...data };
  return ChallengeEntry.create(db, newData);
};

export const fetchEntriesByChallenge = async (challenge_id) => {
  const db = await connectDB();
  return ChallengeEntry.findByChallenge(db, challenge_id);
};

export const fetchEntry = async (id) => {
  const db = await connectDB();
  return ChallengeEntry.findById(db, id);
};

export const modifyEntry = async (id, data) => {
  const db = await connectDB();
  return ChallengeEntry.update(db, id, data);
};

export const removeEntry = async (id) => {
  const db = await connectDB();
  return ChallengeEntry.remove(db, id);
};
