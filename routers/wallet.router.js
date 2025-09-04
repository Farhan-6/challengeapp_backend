import express from "express";
import { getWallet, deposit, withdraw } from "../controllers/wallet.controller.js";
import { authenticate } from "../libs/auth.js";

const router = express.Router();

router.get("/getwallet", authenticate, getWallet);
router.post("/deposit", authenticate, deposit);
router.post("/withdraw", authenticate, withdraw);

export default router;
