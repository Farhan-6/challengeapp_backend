// backend/models/proof.model.js
import connectDB from "../libs/db.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import path from "path";
import { isCloudinaryEnabled, uploadToCloudinary, removeLocalFile } from "../utils/cloudinary.js";

/**
 * createProof options:
 *  - user_id, challenge_id, original_name, filePath, buffer, mimetype, size, metadata, geotag_lat, geotag_lng
 *
 * Behavior:
 * - If buffer present and Cloudinary enabled: upload buffer directly
 * - If filePath present (legacy disk path) and Cloudinary enabled: read file into buffer and upload (no local dir creation)
 * - If Cloudinary not enabled: store binary in DB (data column) or file_url = null
 */
export const createProof = async ({
  user_id = null,
  challenge_id = null,
  original_name,
  filePath = null,
  buffer = null,
  mimetype = null,
  size = null,
  metadata = null,
  geotag_lat = null,
  geotag_lng = null,
} = {}) => {
  const db = await connectDB();
  const id = uuidv4();
  let file_url = null;
  let data = null;

  // Prefer buffer input (memory upload middleware)
  if (buffer) {
    if (isCloudinaryEnabled()) {
      // upload directly from buffer, do not write any temp file
      file_url = await uploadToCloudinary({ buffer, resource_type: "auto", folder: "app/proofs" });
    } else {
      // fallback: store binary inside DB (make sure your proofs.data column can hold it)
      data = buffer;
    }
  } else if (filePath) {
    // legacy: if a local file path is provided, read it into memory and upload from buffer
    try {
      const fileBuffer = await fs.readFile(filePath);
      if (isCloudinaryEnabled()) {
        file_url = await uploadToCloudinary({ buffer: fileBuffer, resource_type: "auto", folder: "app/proofs" });
        // remove the local temp file if present (best-effort)
        try { await removeLocalFile(filePath); } catch (e) {}
      } else {
        data = fileBuffer;
        // optionally remove filePath if you want
        try { await removeLocalFile(filePath); } catch (e) {}
      }
    } catch (err) {
      // cannot read filePath: ignore and proceed (no file stored)
      console.error("createProof: failed to read legacy filePath:", err);
    }
  }

  // insert DB row (fields: adjust to match your schema)
  const sql = `INSERT INTO proofs
    (id, user_id, challenge_id, original_name, file_url, data, mimetype, size, metadata, geotag_lat, geotag_lng, uploaded_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`;
  const params = [
    id,
    user_id,
    challenge_id,
    original_name || null,
    file_url,
    data, // Buffer or null
    mimetype || null,
    size || 0,
    metadata ? JSON.stringify(metadata) : null,
    geotag_lat !== undefined ? geotag_lat : null,
    geotag_lng !== undefined ? geotag_lng : null,
    "active",
  ];
  await db.query(sql, params);
  return { id, file_url };
};

export const getProofById = async (id) => {
  const db = await connectDB();
  const [rows] = await db.query("SELECT * FROM proofs WHERE id = ? LIMIT 1", [id]);
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  if (r.metadata && typeof r.metadata === "string") {
    try { r.metadata = JSON.parse(r.metadata); } catch (e) {}
  }
  return r;
};

export const getProofs = async ({ user_id = null, challenge_id = null, limit = 100, offset = 0 } = {}) => {
  const db = await connectDB();
  const where = [];
  const params = [];
  if (user_id) { where.push("user_id = ?"); params.push(user_id); }
  if (challenge_id) { where.push("challenge_id = ?"); params.push(challenge_id); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sql = `SELECT id, user_id, challenge_id, original_name, file_url, mimetype, size, metadata, geotag_lat, geotag_lng, uploaded_at, status
               FROM proofs ${whereSql} ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit || 100), Number(offset || 0));
  const [rows] = await db.query(sql, params);
  if (rows && rows.length) {
    rows.forEach((r) => {
      if (r.metadata && typeof r.metadata === "string") {
        try { r.metadata = JSON.parse(r.metadata); } catch (e) {}
      }
    });
  }
  return rows;
};

export const deleteProofById = async (id) => {
  const db = await connectDB();
  // optional: if file_url is local path delete file (best-effort)
  try {
    const proof = await getProofById(id);
    if (proof && proof.file_url && !proof.file_url.startsWith("http")) {
      // local path: delete only if file exists
      try {
        if (await fs.pathExists(proof.file_url)) await fs.remove(proof.file_url);
      } catch (e) {}
    }
  } catch (e) {
    // ignore file removal errors
  }
  await db.query("DELETE FROM proofs WHERE id = ?", [id]);
};
