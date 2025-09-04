// controllers/wallet.controller.js
import { getOrCreateWallet, updateWalletBalance } from "../services/wallet.service.js";
import { createTransaction, completeTransaction, failTransaction } from "../services/transaction.service.js";

/**
 * Get current wallet state
 */
export const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id);
    res.json(wallet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Deposit funds (adds to wallet balance)
 * In real-world: Stripe webhook should confirm before marking transaction complete
 */
export const deposit = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid deposit amount" });
    }

    // Create transaction record
    const txn = await createTransaction({
      user_id: req.user.id,
      type: "deposit",
      amount,
    });

    // TODO: Replace this direct update with Stripe payment confirmation
    await updateWalletBalance(req.user.id, amount, "add");
    await completeTransaction(txn.id);

    res.status(201).json({ message: "Deposit successful", txn_id: txn.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Withdraw funds (subtracts from wallet balance)
 * In real-world: integrate Stripe payout API here
 */
export const withdraw = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid withdrawal amount" });
    }

    // Ensure user has enough available (not escrowed) balance
    const wallet = await getOrCreateWallet(req.user.id);
    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Create transaction record
    const txn = await createTransaction({
      user_id: req.user.id,
      type: "payout",
      amount,
    });

    // Subtract immediately (could also be after Stripe payout confirmation)
    await updateWalletBalance(req.user.id, amount, "subtract");
    await completeTransaction(txn.id);

    res.status(201).json({ message: "Withdrawal successful", txn_id: txn.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
