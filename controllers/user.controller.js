// backend/controllers/user.controller.js
import { loginUser, registerUser, refreshAuth, logoutUser } from "../services/user.service.js";
import { createOtp, findValidOtp, markOtpUsed } from "../models/otp.model.js";
import { findPendingById, findPendingByEmail, deletePendingById } from "../models/pendingRegistration.model.js";
import { getUserById, updateUser } from "../models/user.model.js";
import { getPrefsByUser, upsertPref, deletePref } from "../models/preference.model.js";
import { generateOtp } from "../utils/otp.js";
import { createUser } from "../models/user.model.js";
import { sendMail } from "../utils/mailer.js";
import { deleteUser } from "../models/user.model.js";
import { createPending } from "../models/pendingRegistration.model.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import path from "path";
import sharp from "sharp"; // optional - install if you want resizing
const id = uuidv4();
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "avatars");

const MS = 1000;

export const register = async (req, res) => {
  try {
    const { first_name, last_name, phone, email, password, cnic, date_of_birth, gender } = req.body;
    if (!phone || !email || !password || !first_name || !last_name || !cnic || !date_of_birth || !gender) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // hash password before storing in pending table
    const password_hash = await bcrypt.hash(password, 10);

    // create pending registration (same columns as users)
    const pendingId = await createPending({
      first_name,
      last_name,
      phone: phone || null,
      email: email.toLowerCase(),
      password_hash,
      cnic,
      date_of_birth,
      gender,
      role: "user",
      kyc_status: "pending"
    });

    // create and send OTP for email verification
    const code = generateOtp(6);
    const ttl = parseInt(process.env.OTP_TTL_SECONDS || "300", 10);
    const expiresAt = new Date(Date.now() + ttl * MS);
    await createOtp({ target: email.toLowerCase(), code, type: "email_verif", expiresAt });

    await sendMail({
      to: email,
      subject: "Verify your email",
      html: `<p>Your verification code is <strong>${code}</strong>. It expires in ${ttl} seconds.</p>`
    });

    // return pendingId — client must include it with /verify-otp
    return res.status(201).json({ message: "otp_sent", pendingId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress;
    const result = await loginUser({ email, password, ip });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const ip = req.ip;
    const result = await refreshAuth({ refreshToken, ip });
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await logoutUser({ refreshToken });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// send OTP (email or phone)
export const sendOtp = async (req, res) => {
  try {
    const { email, phone, type } = req.body;
    if (!email && !phone) return res.status(400).json({ error: "email or phone required" });
    const target = email ? email.toLowerCase() : phone;
    const code = generateOtp(6);
    const ttl = parseInt(process.env.OTP_TTL_SECONDS || "300", 10);
    const expiresAt = new Date(Date.now() + ttl * MS);
    await createOtp({ target, code, type: type || "login", expiresAt });
    if (email) {
      await sendMail({ to: email, subject: "Your OTP code", html: `<p>Your code is <strong>${code}</strong></p>` });
    }
    // phone sending is not implemented by default — you can add Twilio integration if needed
    return res.json({ message: "otp_sent" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, phone, code, type, pendingId } = req.body;
    if (!code || (!email && !phone)) return res.status(400).json({ error: "missing" });

    const target = email ? email.toLowerCase() : phone;
    const otp = await findValidOtp({ target, code, type: type || "login" });
    if (!otp) return res.status(400).json({ error: "invalid_or_expired" });

    if (type === "email_verif") {
      // get pending registration (prefer pendingId, otherwise try by email)
      let pending;
      if (pendingId) {
        pending = await findPendingById(pendingId);
      } else if (email) {
        pending = await findPendingByEmail(email.toLowerCase());
      }
      if (!pending) return res.status(400).json({ error: "pending_registration_not_found" });

      // create real user from pending row — password_hash already present
      const newUser = {
        id: uuidv4(),
        first_name: pending.first_name,
        last_name: pending.last_name,
        phone: pending.phone,
        email: pending.email,
        password_hash: pending.password_hash,
        cnic: pending.cnic,
        date_of_birth: pending.date_of_birth,
        gender: pending.gender,
        role: pending.role || "user",
        kyc_status: pending.kyc_status || "pending"
      };

      await createUser(newUser);

      // if users table has is_email_verified column, mark it
      try {
        await updateUser(newUser.id, { is_email_verified: 1 });
      } catch (e) {
        // ignore if column doesn't exist
      }

      // delete pending registration
      await deletePendingById(pending.id);
    }

    // mark OTP used
    await markOtpUsed(otp.id);
    return res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PROFILE
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    // drop sensitive fields
    delete user.password_hash;
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const file = req.file; // uploadAvatar.single('avatar') middleware in router
    const { display_name, phone } = req.body;
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (phone !== undefined) updates.phone = phone;

    if (file) {
      // file.path is local path from multer
      // optional image normalization/resizing; keep as-is to avoid dependency if you didn't install sharp
      // If Cloudinary enabled, use it; otherwise store local path.
      try {
        // prefer cloudinary if configured
        const { isCloudinaryEnabled, uploadToCloudinary } = await import("../utils/cloudinary.js");
        if (isCloudinaryEnabled()) {
          const url = await uploadToCloudinary({ filePath: file.path, resource_type: "image", folder: "app/avatars" });
          updates.avatar_url = url;
          // remove local file after upload
          try { await import("fs-extra").then(m=>m.remove(file.path)); } catch(e){}
        } else {
          // store local path (you should serve /uploads as static in express)
          updates.avatar_url = file.path;
        }
      } catch (e) {
        // if cloudinary import/usage fails, fallback to local
        updates.avatar_url = file.path;
      }
    }

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });

    await updateUser(userId, updates);
    const updated = await getUserById(userId);
    return res.json({ ok: true, user: updated });
  } catch (error) {
    console.error("updateProfile error:", error);
    return res.status(400).json({ error: error.message || "Update failed" });
  }
};

// PREFERENCES
export const listPrefs = async (req, res) => {
  try {
    const userId = req.user?.id;
    const prefs = await getPrefsByUser(userId);
    res.json(prefs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const upsertPreference = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "Key required" });
    const pref = await upsertPref({ userId, key, value });
    res.json(pref);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const removePreference = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { key } = req.params;
    await deletePref({ userId, key });
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
export const deleteAccount = async (req, res) => {
  try {
    // authenticate middleware already set req.user (decoded JWT)
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Optional: require password re-confirmation (extra safety). Not implemented here.
    await deleteUser(userId);

    // Optionally, you may also revoke further refresh tokens (done in deleteUser)
    return res.json({ ok: true, message: "Account and related data deleted" });
  } catch (error) {
    console.error("deleteAccount error:", error);
    return res.status(400).json({ error: error.message || "Failed to delete account" });
  }
};