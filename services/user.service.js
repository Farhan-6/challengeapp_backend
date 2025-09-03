// services/user.service.js
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { createUser, findByEmail } from "../models/user.model.js";

export const registerUser = async ({ phone, email, password, display_name }) => {
  const existingUser = await findByEmail(email);
  if (existingUser) throw new Error("Email already registered");

  const password_hash = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    phone,
    email,
    password_hash,
    display_name,
    role: "user",
  };

  await createUser(newUser);

  return { message: "User registered successfully" };
};

export const loginUser = async ({ email, password }) => {
  const user = await findByEmail(email);
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new Error("Invalid email or password");

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token, user };
};
