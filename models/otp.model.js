// backend/models/otp.model.js
import connectDB from "../libs/db.js";
import { v4 as uuidv4 } from "uuid";

export const createOtp = async ({ target, code, type, expiresAt }) => {
  const db = await connectDB();
  const id = uuidv4();
  await db.query(
    "INSERT INTO otps (id, target, code, type, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)",
    [id, target, code, type, expiresAt]
  );
  return { id, target, code, type, expiresAt };
};

export const findValidOtp = async ({ target, code, type }) => {
  const db = await connectDB();
  const [rows] = await db.query(
    "SELECT * FROM otps WHERE target = ? AND code = ? AND type = ? AND used = 0 AND expires_at > NOW()",
    [target, code, type]
  );
  return rows[0];
};

export const markOtpUsed = async (id) => {
  const db = await connectDB();
  await db.query("UPDATE otps SET used = 1 WHERE id = ?", [id]);
};
