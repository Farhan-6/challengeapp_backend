import { Wallet } from "../models/wallet.model.js";
import { v4 as uuidv4 } from "uuid";
import connectDB from "../libs/db.js";

export const getOrCreateWallet = async (user_id) => {
  const db = await connectDB();
  let wallet = await Wallet.findByUser(db, user_id);
  if (!wallet) {
    wallet = await Wallet.create(db, user_id);
  }
  return wallet;
};

export const updateWalletBalance = async (user_id, amount, operation = "add") => {
  const db = await connectDB();
  const wallet = await Wallet.findByUser(db, user_id);
  if (!wallet) throw new Error("Wallet not found");

  // ✅ Convert both to numbers
  const currentBalance = parseFloat(wallet.balance);
  const numericAmount = parseFloat(amount);

  let newBalance = currentBalance;
  if (operation === "add") {
    newBalance += numericAmount;
  } else if (operation === "subtract") {
    if (currentBalance < numericAmount) throw new Error("Insufficient balance");
    newBalance -= numericAmount;
  }

  // ✅ Store rounded to 2 decimals
  newBalance = parseFloat(newBalance.toFixed(2));

  await Wallet.updateBalance(db, user_id, newBalance);
  return { ...wallet, balance: newBalance };
};

