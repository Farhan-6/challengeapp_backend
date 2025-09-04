// services/challengeEntry.service.js
import { v4 as uuidv4 } from "uuid";
import connectDB from "../libs/db.js";
import { ChallengeEntry } from "../models/challengeEntry.model.js";
import { getOrCreateWallet, updateWalletBalance } from "./wallet.service.js";
import { Transaction } from "../models/transaction.model.js";
import { getChallengeById } from "../models/challenge.model.js";

export const addParticipantToChallenge = async (challengeId, participant_id, mediaUrl = null) => {
    const db = await connectDB();

    // Check if participant exists
    const [userRows] = await db.query(`SELECT id FROM users WHERE id = ?`, [participant_id]);
    if (userRows.length === 0) throw new Error("Participant does not exist");

    // Prevent duplicate entry
    const [existing] = await db.query(
        `SELECT id FROM challenge_enteries WHERE challenge_id = ? AND participant_id = ?`,
        [challengeId, participant_id]
    );
    if (existing.length > 0) throw new Error("Already joined this challenge");

    // Fetch challenge details
    const challenge = await getChallengeById(challengeId);
    if (!challenge) throw new Error("Challenge not found");

    // Handle entry fee (if > 0)
    if (challenge.entry_fee > 0) {
        const wallet = await getOrCreateWallet(participant_id);

        const currentBalance = parseFloat(wallet.balance);
        const entryFee = parseFloat(challenge.entry_fee);

        console.log(" Wallet balance:", currentBalance);
        console.log(" Entry fee:", entryFee);

        if (currentBalance < entryFee) {
            throw new Error("Insufficient wallet balance");
        }


        // Deduct balance
        await updateWalletBalance(participant_id, challenge.entry_fee, "subtract");

        // Record transaction
        await Transaction.create(db, {
            id: uuidv4(),
            user_id: participant_id,
            type: "entry_fee",
            amount: challenge.entry_fee,
            status: "completed",
            reference_id: challengeId,
        });
    }

    // Insert participant entry
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


export const payoutWinner = async (challengeId, winnerId) => {
    const db = await connectDB();
    const challenge = await getChallengeById(challengeId);
    if (!challenge) throw new Error("Challenge not found");

    if (challenge.prize_amount > 0) {
        // Credit prize to winner’s wallet
        await updateWalletBalance(winnerId, challenge.prize_amount, "add");

        // Record payout transaction
        await Transaction.create(db, {
            id: uuidv4(),
            user_id: winnerId,
            type: "challenge_payout",
            amount: challenge.prize_amount,
            status: "completed",
            reference_id: challengeId,
        });
    }

    return { success: true, message: "Prize credited to winner" };
};

