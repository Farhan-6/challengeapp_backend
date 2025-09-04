// services/transaction.service.js
import { Transaction } from "../models/transaction.model.js";
import { v4 as uuidv4 } from "uuid";
import connectDB from "../libs/db.js";

export const createTransaction = async ({ user_id, type, amount, reference_id = null }) => {
  const db = await connectDB();
  const txn = {
    id: uuidv4(),
    user_id,
    type,
    amount,
    status: "pending",
    reference_id,
  };
  return Transaction.create(db, txn);
};

export const completeTransaction = async (id) => {
  const db = await connectDB();
  await Transaction.updateStatus(db, id, "completed");
};

export const failTransaction = async (id) => {
  const db = await connectDB();
  await Transaction.updateStatus(db, id, "failed");
};

export const getTransactionsByUser = async (user_id) => {
  const db = await connectDB();
  return Transaction.findByUser(db, user_id);
};
