// controllers/user.controller.js
import { loginUser, registerUser } from "../services/user.service.js";

export const register = async (req, res) => {
  try {
    const { phone, email, password, display_name } = req.body;
    if (!phone || !email || !password || !display_name) {
      return res.status(400).json({
        error: "All fileds are required",
      });
    }
    const result = await registerUser({ phone, email, password, display_name });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
