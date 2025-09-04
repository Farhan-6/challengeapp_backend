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

// Hold money in escrow
export const holdInEscrow = async (userId, amount) => {
  const db = await connectDB();
  const wallet = await Wallet.findByUser(db, userId);
  if (!wallet) throw new Error("Wallet not found");

  const available = parseFloat(wallet.balance);
  if (available < amount) throw new Error("Insufficient balance");

  await db.query(
    `UPDATE wallets 
     SET balance = balance - ?, escrow_balance = escrow_balance + ?, updated_at = NOW() 
     WHERE user_id = ?`,
    [amount, amount, userId]
  );
};

// Release money from escrow to balance
export const releaseFromEscrow = async (userId, amount) => {
  const db = await connectDB();
  const wallet = await Wallet.findByUser(db, userId);
  if (!wallet) throw new Error("Wallet not found");

  const escrow = parseFloat(wallet.escrow_balance);
  if (escrow < amount) throw new Error("Insufficient escrow balance");

  await db.query(
    `UPDATE wallets 
     SET escrow_balance = escrow_balance - ?, balance = balance + ?, updated_at = NOW() 
     WHERE user_id = ?`,
    [amount, amount, userId]
  );
};
