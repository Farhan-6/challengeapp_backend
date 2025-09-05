// services/vote.service.js
import { v4 as uuidv4 } from "uuid";
import connectDB from "../libs/db.js";

export const addVote = async (challengeId, participantId, voterId) => {
  const db = await connectDB();
  const id = uuidv4();

  try {
    // Insert vote into votes table (with challenge_id)
    await db.query(
      `INSERT INTO votes (id, challenge_id, participant_id, voter_id) VALUES (?, ?, ?, ?)`,
      [id, challengeId, participantId, voterId]
    );

    // Update the votes count in the correct challenge_entry row
    await db.query(
      `UPDATE challenge_enteries
       SET votes = votes + 1
       WHERE challenge_id = ? AND participant_id = ?`,
      [challengeId, participantId]
    );

    return { success: true };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new Error("Already voted for this participant in this challenge");
    }
    throw err;
  }
};

export const countVotesForParticipant = async (challengeId, participantId) => {
  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT votes 
     FROM challenge_enteries 
     WHERE challenge_id = ? AND participant_id = ?`,
    [challengeId, participantId]
  );
  return rows.length > 0 ? rows[0].votes : 0;
};
