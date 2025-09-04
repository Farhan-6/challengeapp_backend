// backend/controllers/media.controller.js
import { createProof, getProofById, getProofs, deleteProofById } from "../models/proof.model.js";

/**
 * POST /api/media/upload
 * - multipart/form-data:
 *    - file (binary)
 *    - metadata (optional JSON string)
 *    - geotag_lat, geotag_lng (optional)
 *    - challenge_id (optional)
 * Requires authenticate middleware to set req.user
 */
export const uploadMedia = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const file = req.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const { challenge_id } = req.body;
    const metadata = req.body.metadata ? (() => {
      try { return JSON.parse(req.body.metadata); } catch (e) { return null; }
    })() : null;
    const geotag_lat = req.body.geotag_lat ? Number(req.body.geotag_lat) : null;
    const geotag_lng = req.body.geotag_lng ? Number(req.body.geotag_lng) : null;

    const proof = await createProof({
      user_id: userId,
      challenge_id: challenge_id || null,
      original_name: file.originalname,
      filePath: file.path, // multer stored it to disk
      mimetype: file.mimetype,
      size: file.size,
      metadata,
      geotag_lat,
      geotag_lng,
    });

    return res.json({ ok: true, proof });
  } catch (err) {
    console.error("uploadMedia error:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
};

export const listMedia = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { user_id, challenge_id, limit, offset } = req.query;
    // allow admin or request for user's own media
    const qUser = user_id || userId;
    const rows = await getProofs({ user_id: qUser, challenge_id: challenge_id || null, limit: limit || 100, offset: offset || 0 });
    return res.json({ ok: true, rows });
  } catch (err) {
    console.error("listMedia error:", err);
    return res.status(500).json({ error: err.message || "Failed to list media" });
  }
};

export const getMedia = async (req, res) => {
  try {
    const id = req.params.id;
    const proof = await getProofById(id);
    if (!proof) return res.status(404).json({ error: "Not found" });

    // permission: only owner or admin. Adjust according to your auth/roles.
    const userId = req.user?.id;
    if (proof.user_id && proof.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

    return res.json({ ok: true, proof });
  } catch (err) {
    console.error("getMedia error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const id = req.params.id;
    const proof = await getProofById(id);
    if (!proof) return res.status(404).json({ error: "Not found" });

    const userId = req.user?.id;
    if (proof.user_id && proof.user_id !== userId) return res.status(403).json({ error: "Forbidden" });

    await deleteProofById(id);
    return res.json({ ok: true });
  } catch (err) {
    console.error("deleteMedia error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};


export const downloadMedia = async (req, res) => {
  try {
    const id = req.params.id;
    const proof = await getProofById(id);
    if (!proof) return res.status(404).json({ error: "Not found" });

    // send file buffer
    // proof.data should be a Buffer (mysql2 returns Buffer for BLOB)
    const buffer = proof.data;
    if (!buffer) return res.status(404).json({ error: "File data missing" });

    res.setHeader("Content-Type", proof.mimetype || "application/octet-stream");
    const filename = proof.original_name ? proof.original_name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_") : `${proof.id}`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (err) {
    console.error("downloadMedia error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};


