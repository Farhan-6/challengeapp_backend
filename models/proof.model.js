// backend/models/proof.model.js
import connectDB from "../libs/db.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import path from "path";
import { isCloudinaryEnabled, uploadToCloudinary } from "../utils/cloudinary.js";

const LOCAL_PROOFS_DIR = path.join(process.cwd(), "uploads", "proofs");
fs.ensureDirSync(LOCAL_PROOFS_DIR);

export const createProof = async ({
  user_id = null,
  challenge_id = null,
  original_name,
  filePath = null,
  buffer = null,
  mimetype,
  size = 0,
  metadata = null,
  geotag_lat = null,
  geotag_lng = null,
}) => {
  const db = await connectDB();
  const id = uuidv4();
  let file_url = null;
  let data = null;

  if (filePath) {
    // Prefer cloudinary if enabled
    if (isCloudinaryEnabled()) {
      // use cloudinary uploader - resource_type 'auto' handles images & videos
      file_url = await uploadToCloudinary({ filePath, resource_type: "auto", folder: "app/proofs" });
      // remove local temp file after successful upload
      try { await fs.remove(filePath); } catch (e) {}
    } else {
      // move file into local proofs dir with id filename
      const ext = path.extname(filePath) || path.extname(original_name || "");
      const dest = path.join(LOCAL_PROOFS_DIR, `${id}${ext}`);
      // ensure dest doesn't conflict
      await fs.move(filePath, dest, { overwrite: true });
      file_url = dest; // store local path. In production expose via static route or use object storage
    }
  } else if (buffer) {
    // if buffer is provided and cloudinary enabled, upload via temp file
    if (isCloudinaryEnabled()) {
      const tmp = path.join(LOCAL_PROOFS_DIR, `${id}`);
      await fs.writeFile(tmp, buffer);
      file_url = await uploadToCloudinary({ filePath: tmp, resource_type: "auto", folder: "app/proofs" });
      try { await fs.remove(tmp); } catch (e) {}
    } else {
      // store binary in DB (optional — caution with DB size)
      data = buffer;
    }
  }

  const sql = `INSERT INTO proofs (id, user_id, challenge_id, original_name, file_url, data, mimetype, size, metadata, geotag_lat, geotag_lng, uploaded_at, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`;
  const params = [
    id,
    user_id,
    challenge_id,
    original_name || null,
    file_url,
    data, // may be null
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

export const getProofs = async ({ user_id = null, challenge_id = null, limit = 100, offset = 0 } = {}) => {
  const db = await connectDB();
  const where = [];
  const params = [];
  if (user_id) { where.push("user_id = ?"); params.push(user_id); }
  if (challenge_id) { where.push("challenge_id = ?"); params.push(challenge_id); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const sql = `SELECT id, user_id, challenge_id, original_name, file_url, mimetype, size, metadata, geotag_lat, geotag_lng, uploaded_at, status FROM proofs ${whereSql} ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit || 100), Number(offset || 0));
  const [rows] = await db.query(sql, params);
  rows.forEach((r) => {
    if (r.metadata && typeof r.metadata === "string") {
      try { r.metadata = JSON.parse(r.metadata); } catch (e) {}
    }
  });
  return rows;
};

export const getProofById = async (id) => {
  const db = await connectDB();
  const [rows] = await db.query(`SELECT * FROM proofs WHERE id = ? LIMIT 1`, [id]);
  if (rows[0] && rows[0].metadata && typeof rows[0].metadata === "string") {
    try { rows[0].metadata = JSON.parse(rows[0].metadata); } catch (e) {}
  }
  return rows[0] || null;
};

export const deleteProofById = async (id) => {
  const db = await connectDB();
  // optional: if file_url is local path delete file
  try {
    const proof = await getProofById(id);
    if (proof && proof.file_url && !proof.file_url.startsWith("http")) {
      try { await fs.remove(proof.file_url); } catch (e) {}
    }
  } catch (e) {
    // ignore file removal errors
  }
  await db.query("DELETE FROM proofs WHERE id = ?", [id]);
};
