import express from "express";
import { deposit, webhook } from "../controllers/payment.controller.js";
import { authenticate } from "../libs/auth.js";
const router = express.Router();

router.post("/deposit", authenticate , deposit);
// router.post("/webhook" , express.raw({ type: "application/json" }), webhook);

export default router;
