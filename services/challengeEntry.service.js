// services/challengeEntry.service.js
import { v4 as uuidv4 } from "uuid";
import connectDB from "../libs/db.js";
import { ChallengeEntry } from "../models/challengeEntry.model.js";
import { getOrCreateWallet } from "./wallet.service.js";
import { Transaction } from "../models/transaction.model.js";
import { getChallengeById } from "../models/challenge.model.js";

/**
 * Add participant to a challenge (escrow entry fee if required)
 */
export const addParticipantToChallenge = async (challengeId, participant_id, mediaUrl = null) => {
    const db = await connectDB();

    // ✅ Check if participant exists
    const [userRows] = await db.query(`SELECT id FROM users WHERE id = ?`, [participant_id]);
    if (userRows.length === 0) throw new Error("Participant does not exist");

    // ✅ Prevent duplicate entry
    const [existing] = await db.query(
        `SELECT id FROM challenge_enteries WHERE challenge_id = ? AND participant_id = ?`,
        [challengeId, participant_id]
    );
    if (existing.length > 0) throw new Error("Already joined this challenge");

    // ✅ Fetch challenge details
    const challenge = await getChallengeById(challengeId);
    if (!challenge) throw new Error("Challenge not found");

    // ✅ Handle entry fee (escrow hold)
    if (challenge.entry_fee > 0) {
        const wallet = await getOrCreateWallet(participant_id);

        const currentBalance = parseFloat(wallet.balance);
        const entryFee = parseFloat(challenge.entry_fee);

        if (currentBalance < entryFee) {
            throw new Error("Insufficient wallet balance");
        }

        // Move funds to escrow
        await db.query(
            `UPDATE wallets 
             SET balance = balance - ?, escrow_balance = escrow_balance + ?, updated_at = NOW() 
             WHERE user_id = ?`,
            [entryFee, entryFee, participant_id]
        );

        // Record escrow transaction
        await Transaction.create(db, {
            id: uuidv4(),
            user_id: participant_id,
            type: "escrow_hold",
            amount: entryFee,
            status: "completed",
            reference_id: challengeId,
        });
    }

    // ✅ Insert participant entry
    const id = uuidv4();
    await db.query(
        `INSERT INTO challenge_enteries (id, challenge_id, participant_id, media_url)
         VALUES (?, ?, ?, ?)`,
        [id, challengeId, participant_id, mediaUrl]
    );

    return { id, challenge_id: challengeId, participant_id, media_url: mediaUrl };
};

/**
 * Generic entry management
 */
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

/**
 * Payout winner → release prize from escrow
 */
export const payoutWinner = async (challengeId, winnerId) => {
    const db = await connectDB();
    const challenge = await getChallengeById(challengeId);
    if (!challenge) throw new Error("Challenge not found");

    if (challenge.prize_amount > 0) {
        // Release funds from escrow to winner
        await db.query(
            `UPDATE wallets 
             SET escrow_balance = escrow_balance - ?, balance = balance + ?, updated_at = NOW()
             WHERE user_id = ?`,
            [challenge.prize_amount, challenge.prize_amount, winnerId]
        );

        // Record escrow release transaction
        await Transaction.create(db, {
            id: uuidv4(),
            user_id: winnerId,
            type: "escrow_release",
            amount: challenge.prize_amount,
            status: "completed",
            reference_id: challengeId,
        });
    }

    return { success: true, message: "Prize released from escrow to winner" };
};
