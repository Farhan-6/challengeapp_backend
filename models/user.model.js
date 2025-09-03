// models/userModel.js
import connectDB from "../libs/db.js";

export const createUser = async (user) => {
  const db = await connectDB();
  const sql = `
    INSERT INTO users (id, phone, email, password_hash, display_name, role, kyc_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    user.id,
    user.phone,
    user.email,
    user.password_hash,
    user.display_name,
    user.role || "user",
    "pending",
  ];
  await db.query(sql, values);
};

export const findByEmail = async (email) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

export const findByPhone = async (phone) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM users WHERE phone = ?", [phone]);
  return rows[0];
};
