import connectDB from "../libs/db.js";
import { v4 as uuidv4 } from "uuid";

export const createPending = async ({
  first_name,
  last_name,
  phone,
  email,
  password_hash,
  cnic,
  date_of_birth,
  gender,
  role,
  kyc_status
}) => {
  const db = await connectDB();
  const id = uuidv4();
  await db.query(
    `INSERT INTO pending_registrations
      (id, first_name, last_name, phone, email, password_hash, cnic, date_of_birth, gender, role, kyc_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      first_name,
      last_name,
      phone || null,
      email ? email.toLowerCase() : null,
      password_hash,
      cnic || null,
      date_of_birth || null,
      gender || null,
      role || "user",
      kyc_status || "pending"
    ]
  );
  return id;
};

export const findPendingById = async (id) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM pending_registrations WHERE id = ?", [id]);
  return rows[0];
};

export const findPendingByEmail = async (email) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM pending_registrations WHERE email = ?", [email.toLowerCase()]);
  return rows[0];
};

export const findPendingByPhone = async (phone) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM pending_registrations WHERE phone = ?", [phone]);
  return rows[0];
};

export const deletePendingById = async (id) => {
  const db = await connectDB();
  await db.query("DELETE FROM pending_registrations WHERE id = ?", [id]);
};

export const deletePendingByEmail = async (email) => {
  const db = await connectDB();
  await db.query("DELETE FROM pending_registrations WHERE email = ?", [email.toLowerCase()]);
};
