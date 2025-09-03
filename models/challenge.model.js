// models/challenge.model.js
import connectDB from "../libs/db.js";

export const createChallenge = async (challenge) => {
  const db = await connectDB();
  const sql = `
    INSERT INTO challenges 
    (id, creator_id, title, description, category, entry_fee, prize_amount, visibility, status, judging_mode, start_time, end_time) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    challenge.id,
    challenge.creator_id,
    challenge.title,
    challenge.description,
    challenge.category,
    challenge.entry_fee,
    challenge.prize_amount,
    challenge.visibility || "public",
    challenge.status || "draft",
    challenge.judging_mode || "creator",
    challenge.start_time,
    challenge.end_time,
  ];
  await db.query(sql, values);
};

export const getChallengeById = async (id) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM challenges WHERE id = ?", [id]);
  return rows[0];
};

export const getAllChallenges = async () => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM challenges");
  return rows;
};

export const updateChallenge = async (id, updates) => {
  const db = await connectDB();
  const fields = Object.keys(updates).map((key) => `${key} = ?`).join(", ");
  const values = Object.values(updates);
  await db.query(`UPDATE challenges SET ${fields} WHERE id = ?`, [...values, id]);
};

export const deleteChallenge = async (id) => {
  const db = await connectDB();
  await db.query("DELETE FROM challenges WHERE id = ?", [id]);
};
