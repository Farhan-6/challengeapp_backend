import { getOrCreateWallet, updateWalletBalance } from "../services/wallet.service.js";
import { createTransaction, completeTransaction, failTransaction } from "../services/transaction.service.js";

export const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    res.json(wallet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    const txn = await createTransaction({ user_id: req.user.id, type: "deposit", amount });
    // TODO: Call Stripe API for payment intent here

    await updateWalletBalance(req.user.id, amount, "add");
    await completeTransaction(txn.id);

    res.status(201).json({ message: "Deposit successful", txn_id: txn.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    const txn = await createTransaction({ user_id: req.user.id, type: "payout", amount });
    await updateWalletBalance(req.user.id, amount, "subtract");
    await completeTransaction(txn.id);
    res.status(201).json({ message: "Withdrawal successful", txn_id: txn.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
