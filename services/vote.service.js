// services/vote.service.js
import { v4 as uuidv4 } from "uuid";
import connectDB from "../libs/db.js";

export const addVote = async (participantId, voterId) => {
  const db = await connectDB();
  const id = uuidv4();

  try {
    await db.query(
      `INSERT INTO votes (id, participant_id, voter_id) VALUES (?, ?, ?)`,
      [id, participantId, voterId]
    );
    return { success: true };
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      throw new Error("Already voted for this participant");
    }
    throw err;
  }
};

export const countVotesForParticipant = async (participantId) => {
  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT COUNT(*) as total FROM votes WHERE participant_id = ?`,
    [participantId]
  );
  return rows[0].total;
};
