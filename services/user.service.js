// backend/services/user.service.js
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { createUser, findByEmail, findByPhone, getUserById, updateUser } from "../models/user.model.js";
import { createRefreshToken, findRefreshToken, revokeRefreshToken } from "../models/refreshToken.model.js";
import { createOtp } from "../models/otp.model.js";
import { sendMail } from "../utils/mailer.js";
import { generateOtp } from "../utils/otp.js";

const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m"; // e.g. "15m"
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TTL_DAYS || "30", 10); // days

export const registerUser = async ({  first_name, last_name, phone, email, password, cnic, date_of_birth, gender }) => {
  const existingUser = await findByEmail(email);
  if (existingUser) throw new Error("Email already registered");

  const password_hash = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    first_name,
    last_name,
    phone: phone || null,
    email,
    password_hash,
    cnic,
    date_of_birth,
     gender,
    role: "user",
    kyc_status: "pending"
  };

  await createUser(newUser);

  // create OTP for email verification
  try {
    const otpCode = generateOtp(6);
    const ttlSeconds = parseInt(process.env.OTP_TTL_SECONDS || "300", 10); // default 5 minutes
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await createOtp({ target: email.toLowerCase(), code: otpCode, type: "email_verif", expiresAt });

    // send email (if configured). sendMail logs if SMTP not set.
    await sendMail({
      to: email,
      subject: "Verify your email",
      html: `<p>Your verification code is <strong>${otpCode}</strong>. It expires in ${ttlSeconds} seconds.</p>`
    });
  } catch (e) {
    // non-fatal: registration succeeded even if mail fails
    console.warn("Failed to send verification email:", e.message || e);
  }

  return { message: "User registered successfully (OTP sent to email if configured)" };
};

export const loginUser = async ({ email, password, ip }) => {
  const user = await findByEmail(email);
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new Error("Invalid email or password");

  // create access token (JWT)
  const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });

  // create refresh token (random UUID stored in DB)
  const refreshToken = uuidv4();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await createRefreshToken({ userId: user.id, token: refreshToken, expiresAt, createdByIp: ip });

  return { accessToken, refreshToken, user };
};

// refresh: rotate refresh token (revoke old, create new)
export const refreshAuth = async ({ refreshToken, ip }) => {
  if (!refreshToken) throw new Error("refreshToken required");
  const tokenRec = await findRefreshToken(refreshToken);
  if (!tokenRec) throw new Error("Invalid refresh token");
  if (tokenRec.revoked) throw new Error("Refresh token revoked");
  if (new Date(tokenRec.expires_at) < new Date()) throw new Error("Refresh token expired");

  // revoke old token
  await revokeRefreshToken(refreshToken);

  // issue new tokens
  const userId = tokenRec.user_id;
  const user = await getUserById(userId);
  if (!user) throw new Error("User not found");

  const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
  const newRefreshToken = uuidv4();
  const newExpiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await createRefreshToken({ userId: user.id, token: newRefreshToken, expiresAt: newExpiresAt, createdByIp: ip });

  return { accessToken, refreshToken: newRefreshToken, user };
};

export const logoutUser = async ({ refreshToken }) => {
  if (!refreshToken) throw new Error("refreshToken required");
  await revokeRefreshToken(refreshToken);
  return { message: "Logged out" };
};
