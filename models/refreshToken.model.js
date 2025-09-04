// backend/models/refreshToken.model.js
import connectDB from "../libs/db.js";
import { v4 as uuidv4 } from "uuid";

export const createRefreshToken = async ({ userId, token, expiresAt, createdByIp }) => {
  const db = await connectDB();
  const id = uuidv4();
  await db.query(
    "INSERT INTO refresh_tokens (id, user_id, token, revoked, expires_at, created_by_ip) VALUES (?, ?, ?, ?, ?, ?)",
    [id, userId, token, 0, expiresAt, createdByIp || null]
  );
  return { id, userId, token, expiresAt };
};

export const findRefreshToken = async (token) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM refresh_tokens WHERE token = ?", [token]);
  return rows[0];
};

export const revokeRefreshToken = async (token) => {
  const db = await connectDB();
  await db.query("UPDATE refresh_tokens SET revoked = 1 WHERE token = ?", [token]);
};

export const revokeAllRefreshTokensForUser = async (userId) => {
  const db = await connectDB();
  await db.query("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", [userId]);
};
