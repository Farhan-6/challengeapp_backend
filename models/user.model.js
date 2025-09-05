// backend/models/user.model.js
import connectDB from "../libs/db.js";

export const createUser = async (user) => {
  const db = await connectDB();
  const sql = `
    INSERT INTO users (id, first_name, last_name, phone, email, password_hash, cnic, date_of_birth, gender, role, kyc_status, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    user.id,
    user.first_name,
    user.last_name,
    user.phone || null,
    user.email ? user.email.toLowerCase() : null,
    user.password_hash,
    user.cnic || null,
    user.date_of_birth || null,
    user.gender || null,
    user.role || "user",
    user.kyc_status || "pending",
    user.avatar_url || null,
  ];
  const [res] = await db.query(sql, values);
  return { id: user.id, affectedRows: res.affectedRows };
};

export const getUserById = async (id) => {
  const db = await connectDB();
  const [rows] = await db.query(
    `SELECT id, first_name, last_name, phone, email, cnic, date_of_birth, gender, role, kyc_status, avatar_url FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

export const findByEmail = async (email) => {
  if (!email) return null;
  const db = await connectDB();
  const [rows] = await db.query(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email.toLowerCase()]);
  return rows[0] || null;
};

export const findByPhone = async (phone) => {
  if (!phone) return null;
  const db = await connectDB();
  const [rows] = await db.query(`SELECT * FROM users WHERE phone = ? LIMIT 1`, [phone]);
  return rows[0] || null;
};

export const updateUser = async (id, updates = {}) => {
  if (!id) throw new Error("id required");
  const db = await connectDB();
  const keys = Object.keys(updates);
  if (keys.length === 0) return 0;
  const set = keys.map((k) => `${k} = ?`).join(", ");
  const params = keys.map((k) => updates[k]);
  params.push(id);
  const sql = `UPDATE users SET ${set} WHERE id = ?`;
  const [res] = await db.query(sql, params);
  return res.affectedRows;
};

export const deleteUser = async (userId) => {
  const db = await connectDB();
  try {
    await db.beginTransaction();
    // adjust these related deletes to match your schema
    await db.query("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]).catch(() => {});
    await db.query("DELETE FROM preferences WHERE user_id = ?", [userId]).catch(() => {});
    await db.query("DELETE FROM proofs WHERE user_id = ?", [userId]).catch(() => {});
    await db.query("DELETE FROM challenges WHERE creator_id = ?", [userId]).catch(() => {});
    await db.query("DELETE FROM users WHERE id = ?", [userId]);
    await db.commit();
    return { success: true };
  } catch (err) {
    try {
      await db.rollback();
    } catch (e) {}
    throw err;
  }
};
