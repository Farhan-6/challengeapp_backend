// backend/models/preference.model.js
import connectDB from "../libs/db.js";
import { v4 as uuidv4 } from "uuid";

export const getPrefsByUser = async (userId) => {
  const db = await connectDB();
  const [rows] = await db.query(
    "SELECT pref_key AS `key`, pref_value AS `value` FROM preferences WHERE user_id = ?",
    [userId]
  );
  return rows;
};

export const upsertPref = async ({ userId, key, value }) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT id FROM preferences WHERE user_id = ? AND pref_key = ?", [userId, key]);
  if (rows.length) {
    await db.query("UPDATE preferences SET pref_value = ? WHERE user_id = ? AND pref_key = ?", [value, userId, key]);
  } else {
    const id = uuidv4();
    await db.query("INSERT INTO preferences (id, user_id, pref_key, pref_value) VALUES (?, ?, ?, ?)", [id, userId, key, value]);
  }
  return { userId, key, value };
};

export const deletePref = async ({ userId, key }) => {
  const db = await connectDB();
  await db.query("DELETE FROM preferences WHERE user_id = ? AND pref_key = ?", [userId, key]);
};
