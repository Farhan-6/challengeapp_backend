// services/jury.service.js
import { v4 as uuidv4 } from "uuid";
import connectDB from "../libs/db.js";
import { payoutWinner } from "./challengeEntry.service.js";
import { countVotesForParticipant } from "./vote.service.js";

export const jurySelectWinner = async (challengeId, juryId, winnerId) => {
  const db = await connectDB();
  const id = uuidv4();

  await db.query(
    `INSERT INTO jury_decisions (id, challenge_id, jury_id, winner_id)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE winner_id = VALUES(winner_id)`,
    [id, challengeId, juryId, winnerId]
  );

  return { success: true, message: "Jury decision recorded" };
};


export const finalizeWinner = async (challengeId) => {
  const db = await connectDB();

  const [juryVotes] = await db.query(
    `SELECT winner_id, COUNT(*) as count
     FROM jury_decisions
     WHERE challenge_id = ?
     GROUP BY winner_id`,
    [challengeId]
  );

  if (!juryVotes.length) {
    throw new Error("No jury decisions yet");
  }

  // get majority
  juryVotes.sort((a, b) => b.count - a.count);
  let winnerId = juryVotes[0].winner_id;

  // handle tie with community votes
  const tied = juryVotes.filter(v => v.count === juryVotes[0].count);
  if (tied.length > 1) {
    let maxVotes = -1;
    for (const t of tied) {
      const voteCount = await countVotesForParticipant(t.winner_id); // ⚠️ need to adjust vote table
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        winnerId = t.winner_id;
      }
    }
  }

  // payout and mark complete
  await payoutWinner(challengeId, winnerId);
  await db.query(`UPDATE challenges SET status = 'closed' WHERE id = ?`, [challengeId]);

  return { success: true, message: "Winner finalized", winnerId };
};

